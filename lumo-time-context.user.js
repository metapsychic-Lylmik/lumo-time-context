// ==UserScript==
// @name         Lumo Current Date/Time 3.7.1
// @namespace    lumo-current-time
// @version      3.7.1
// @description  Adds local time, conversation context, elapsed time, relative-date resolution, and world-time resolution to Lumo messages
// @match        https://lumo.proton.me/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const STORAGE_PREFIX = 'lumo-clock-v3:';
    const PENDING_KEY = STORAGE_PREFIX + 'pending';

    /*
     * A gap this long is considered a "return" to the conversation.
     * This is only used for contextual information when relevant.
     */
    const RETURN_GAP_MS = 30 * 60 * 1000;

    function addMonthsSafely(date, amount) {
        const result = new Date(date);
        const originalDay = result.getDate();

        result.setDate(1);
        result.setMonth(
            result.getMonth() + amount
        );

        const lastDayOfMonth =
            new Date(
                result.getFullYear(),
                result.getMonth() + 1,
                0
            ).getDate();

        result.setDate(
            Math.min(
                originalDay,
                lastDayOfMonth
            )
        );

        return result;
    }

    function getComposer() {
        return document.querySelector(
            'textarea.tiptap.ProseMirror.composer'
        );
    }

    function getConversationId() {
        const match = location.pathname.match(
            /\/c\/([0-9a-f-]{36})\/?$/i
        );

        return match ? match[1] : null;
    }

    function getStorageKey() {
        const id = getConversationId();

        return id
            ? STORAGE_PREFIX + id
            : PENDING_KEY;
    }

    function getState(key) {
        try {
            const saved = localStorage.getItem(key);

            if (saved) {
                const state = JSON.parse(saved);

                return {
                    messageNumber:
                        Number.isFinite(state.messageNumber)
                            ? state.messageNumber
                            : 0,

                    lastTimestamp:
                        Number.isFinite(state.lastTimestamp)
                            ? state.lastTimestamp
                            : null,

                    firstTimestamp:
                        Number.isFinite(state.firstTimestamp)
                            ? state.firstTimestamp
                            : null,

                    sessionStartTimestamp:
                        Number.isFinite(
                            state.sessionStartTimestamp
                        )
                            ? state.sessionStartTimestamp
                            : null,

                    sessionCount:
                        Number.isFinite(state.sessionCount)
                            ? state.sessionCount
                            : 0
                };
            }
        } catch (error) {
            console.log(
                '[Lumo Clock] Could not read state'
            );
        }

        return {
            messageNumber: 0,
            lastTimestamp: null,
            firstTimestamp: null,
            sessionStartTimestamp: null,
            sessionCount: 0
        };
    }

    function saveState(key, state) {
        try {
            localStorage.setItem(
                key,
                JSON.stringify(state)
            );
        } catch (error) {
            console.log(
                '[Lumo Clock] Could not save state'
            );
        }
    }

    function getCurrentDateTime() {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        }).format(new Date());
    }

    function getDateString(date) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }).format(date);
    }

    function getDateTimeString(timestamp) {
        return new Intl.DateTimeFormat('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short'
        }).format(new Date(timestamp));
    }

    function formatElapsed(milliseconds) {
        if (!milliseconds || milliseconds < 1000) {
            return null;
        }

        let seconds = Math.floor(
            milliseconds / 1000
        );

        const days = Math.floor(
            seconds / 86400
        );

        seconds %= 86400;

        const hours = Math.floor(
            seconds / 3600
        );

        seconds %= 3600;

        const minutes = Math.floor(
            seconds / 60
        );

        seconds %= 60;

        const parts = [];

        if (days) {
            parts.push(days + 'd');
        }

        if (hours) {
            parts.push(hours + 'h');
        }

        if (minutes) {
            parts.push(minutes + 'm');
        }

        if (seconds && parts.length < 2) {
            parts.push(seconds + 's');
        }

        return parts.join(' ');
    }

    /*
     * =========================================================
     * TIER 3
     * Relative-date / calendar resolution
     * =========================================================
     */

    function getRelativeDateContext(message) {
        const lower = message.toLowerCase();
        const now = new Date();
        const references = [];

        function addReference(phrase, date) {
            references.push(
                'Date reference: "' +
                phrase +
                '" = ' +
                getDateString(date)
            );
        }

        /*
         * Today
         */
        if (/\btoday\b/.test(lower)) {
            addReference('today', now);
        }

        /*
         * Yesterday
         */
        if (/\byesterday\b/.test(lower)) {
            const date = new Date(now);

            date.setDate(
                date.getDate() - 1
            );

            addReference(
                'yesterday',
                date
            );
        }

        /*
         * Tomorrow
         */
        if (/\btomorrow\b/.test(lower)) {
            const date = new Date(now);

            date.setDate(
                date.getDate() + 1
            );

            addReference(
                'tomorrow',
                date
            );
        }

        /*
         * This morning / afternoon / evening / tonight
         */
        if (/\bthis morning\b/.test(lower)) {
            addReference(
                'this morning',
                now
            );
        }

        if (/\bthis afternoon\b/.test(lower)) {
            addReference(
                'this afternoon',
                now
            );
        }

        if (/\bthis evening\b/.test(lower)) {
            addReference(
                'this evening',
                now
            );
        }

        if (/\btonight\b/.test(lower)) {
            addReference(
                'tonight',
                now
            );
        }

        /*
         * Week calculations use Monday as the start of the week.
         */
        function getMonday(date) {
            const result = new Date(date);
            const day = result.getDay();

            result.setDate(
                result.getDate() -
                ((day + 6) % 7)
            );

            return result;
        }

        /*
         * This week
         */
        if (/\bthis week\b/.test(lower)) {
            addReference(
                'this week starts',
                getMonday(now)
            );
        }

        /*
         * Next week
         */
        if (/\bnext week\b/.test(lower)) {
            const date = getMonday(now);

            date.setDate(
                date.getDate() + 7
            );

            addReference(
                'next week starts',
                date
            );
        }

        /*
         * Last week
         */
        if (/\blast week\b/.test(lower)) {
            const date = getMonday(now);

            date.setDate(
                date.getDate() - 7
            );

            addReference(
                'last week starts',
                date
            );
        }

        /*
         * Next month
         */
        if (/\bnext month\b/.test(lower)) {
            addReference(
                'next month starts',
                new Date(
                    now.getFullYear(),
                    now.getMonth() + 1,
                    1
                )
            );
        }

        /*
         * Last month
         */
        if (/\blast month\b/.test(lower)) {
            addReference(
                'last month starts',
                new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                )
            );
        }

        /*
         * Weekday calculations.
         */
        const weekdays = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6
        };

        for (const [
            weekdayName,
            weekdayNumber
        ] of Object.entries(weekdays)) {

            /*
             * Next weekday
             */
            const nextPattern =
                new RegExp(
                    '\\bnext\\s+' +
                    weekdayName +
                    '\\b'
                );

            if (nextPattern.test(lower)) {
                const date = new Date(now);
                const currentDay = date.getDay();

                let daysAhead =
                    (weekdayNumber -
                        currentDay +
                        7) % 7;

                if (daysAhead === 0) {
                    daysAhead = 7;
                }

                date.setDate(
                    date.getDate() + daysAhead
                );

                addReference(
                    'next ' + weekdayName,
                    date
                );
            }

            /*
             * Last weekday
             */
            const lastPattern =
                new RegExp(
                    '\\blast\\s+' +
                    weekdayName +
                    '\\b'
                );

            if (lastPattern.test(lower)) {
                const date = new Date(now);
                const currentDay = date.getDay();

                let daysBehind =
                    (currentDay -
                        weekdayNumber +
                        7) % 7;

                if (daysBehind === 0) {
                    daysBehind = 7;
                }

                date.setDate(
                    date.getDate() - daysBehind
                );

                addReference(
                    'last ' + weekdayName,
                    date
                );
            }

            /*
             * This weekday
             */
            const thisPattern =
                new RegExp(
                    '\\bthis\\s+' +
                    weekdayName +
                    '\\b'
                );

            if (thisPattern.test(lower)) {
                const date = new Date(now);
                const currentDay = date.getDay();

                const difference =
                    weekdayNumber -
                    currentDay;

                date.setDate(
                    date.getDate() + difference
                );

                addReference(
                    'this ' + weekdayName,
                    date
                );
            }
        }

        /*
         * In N days
         */
        const inDaysMatch = lower.match(
            /\bin\s+(\d+)\s+days?\b/
        );

        if (inDaysMatch) {
            const amount =
                parseInt(
                    inDaysMatch[1],
                    10
                );

            if (
                Number.isFinite(amount) &&
                amount <= 365
            ) {
                const date = new Date(now);

                date.setDate(
                    date.getDate() + amount
                );

                addReference(
                    'in ' +
                    amount +
                    ' ' +
                    (
                        amount === 1
                            ? 'day'
                            : 'days'
                    ),
                    date
                );
            }
        }

        /*
         * N days ago
         */
        const daysAgoMatch = lower.match(
            /\b(\d+)\s+days?\s+ago\b/
        );

        if (daysAgoMatch) {
            const amount =
                parseInt(
                    daysAgoMatch[1],
                    10
                );

            if (
                Number.isFinite(amount) &&
                amount <= 365
            ) {
                const date = new Date(now);

                date.setDate(
                    date.getDate() - amount
                );

                addReference(
                    amount +
                    ' ' +
                    (
                        amount === 1
                            ? 'day'
                            : 'days'
                    ) +
                    ' ago',
                    date
                );
            }
        }

        /*
         * In N weeks
         */
        const inWeeksMatch = lower.match(
            /\bin\s+(\d+)\s+weeks?\b/
        );

        if (inWeeksMatch) {
            const amount =
                parseInt(
                    inWeeksMatch[1],
                    10
                );

            if (
                Number.isFinite(amount) &&
                amount <= 52
            ) {
                const date = new Date(now);

                date.setDate(
                    date.getDate() +
                    amount * 7
                );

                addReference(
                    'in ' +
                    amount +
                    ' ' +
                    (
                        amount === 1
                            ? 'week'
                            : 'weeks'
                    ),
                    date
                );
            }
        }

        /*
         * N weeks ago
         */
        const weeksAgoMatch = lower.match(
            /\b(\d+)\s+weeks?\s+ago\b/
        );

        if (weeksAgoMatch) {
            const amount =
                parseInt(
                    weeksAgoMatch[1],
                    10
                );

            if (
                Number.isFinite(amount) &&
                amount <= 52
            ) {
                const date = new Date(now);

                date.setDate(
                    date.getDate() -
                    amount * 7
                );

                addReference(
                    amount +
                    ' ' +
                    (
                        amount === 1
                            ? 'week'
                            : 'weeks'
                    ) +
                    ' ago',
                    date
                );
            }
        }

        /*
         * In N months
         */
        const inMonthsMatch = lower.match(
            /\bin\s+(\d+)\s+months?\b/
        );

        if (inMonthsMatch) {
            const amount =
                parseInt(
                    inMonthsMatch[1],
                    10
                );

            if (
                Number.isFinite(amount) &&
                amount <= 24
            ) {
                const date = new Date(now);

                const resolvedDate =
                    addMonthsSafely(
                        date,
                        amount
                    );

                addReference(
                    'in ' +
                    amount +
                    ' ' +
                    (
                        amount === 1
                            ? 'month'
                            : 'months'
                    ),
                    resolvedDate
                );
            }
        }

        /*
         * N months ago
         */
        const monthsAgoMatch = lower.match(
            /\b(\d+)\s+months?\s+ago\b/
        );

        if (monthsAgoMatch) {
            const amount =
                parseInt(
                    monthsAgoMatch[1],
                    10
                );

            if (
                Number.isFinite(amount) &&
                amount <= 24
            ) {
                const date = new Date(now);

                const resolvedDate =
                    addMonthsSafely(
                        date,
                        -amount
                    );

                addReference(
                    amount +
                    ' ' +
                    (
                        amount === 1
                            ? 'month'
                            : 'months'
                    ) +
                    ' ago',
                    resolvedDate
                );
            }
        }

        /*
         * Remove duplicate references.
         */
        return [
            ...new Set(references)
        ].join('\n');
    }

    /*
     * =========================================================
     * WORLD TIME
     * Current date/time in requested locations
     * =========================================================
     */

    const WORLD_TIME_ZONES = {
        london: {
            label: 'London',
            timeZone: 'Europe/London'
        },

        'united kingdom': {
            label: 'London',
            timeZone: 'Europe/London'
        },

        uk: {
            label: 'London',
            timeZone: 'Europe/London'
        },

        paris: {
            label: 'Paris',
            timeZone: 'Europe/Paris'
        },

        berlin: {
            label: 'Berlin',
            timeZone: 'Europe/Berlin'
        },

        madrid: {
            label: 'Madrid',
            timeZone: 'Europe/Madrid'
        },

        rome: {
            label: 'Rome',
            timeZone: 'Europe/Rome'
        },

        amsterdam: {
            label: 'Amsterdam',
            timeZone: 'Europe/Amsterdam'
        },

        dublin: {
            label: 'Dublin',
            timeZone: 'Europe/Dublin'
        },

        lisbon: {
            label: 'Lisbon',
            timeZone: 'Europe/Lisbon'
        },

        reykjavik: {
            label: 'Reykjavik',
            timeZone: 'Atlantic/Reykjavik'
        },

        tokyo: {
            label: 'Tokyo',
            timeZone: 'Asia/Tokyo'
        },

        seoul: {
            label: 'Seoul',
            timeZone: 'Asia/Seoul'
        },

        beijing: {
            label: 'Beijing',
            timeZone: 'Asia/Shanghai'
        },

        shanghai: {
            label: 'Shanghai',
            timeZone: 'Asia/Shanghai'
        },

        hongkong: {
            label: 'Hong Kong',
            timeZone: 'Asia/Hong_Kong'
        },

        'hong kong': {
            label: 'Hong Kong',
            timeZone: 'Asia/Hong_Kong'
        },

        singapore: {
            label: 'Singapore',
            timeZone: 'Asia/Singapore'
        },

        bangkok: {
            label: 'Bangkok',
            timeZone: 'Asia/Bangkok'
        },

        delhi: {
            label: 'Delhi',
            timeZone: 'Asia/Kolkata'
        },

        mumbai: {
            label: 'Mumbai',
            timeZone: 'Asia/Kolkata'
        },

        dubai: {
            label: 'Dubai',
            timeZone: 'Asia/Dubai'
        },

        sydney: {
            label: 'Sydney',
            timeZone: 'Australia/Sydney'
        },

        melbourne: {
            label: 'Melbourne',
            timeZone: 'Australia/Melbourne'
        },

        perth: {
            label: 'Perth',
            timeZone: 'Australia/Perth'
        },

        auckland: {
            label: 'Auckland',
            timeZone: 'Pacific/Auckland'
        },

        'new york': {
            label: 'New York',
            timeZone: 'America/New_York'
        },

        chicago: {
            label: 'Chicago',
            timeZone: 'America/Chicago'
        },

        denver: {
            label: 'Denver',
            timeZone: 'America/Denver'
        },

        'los angeles': {
            label: 'Los Angeles',
            timeZone: 'America/Los_Angeles'
        },

        'san francisco': {
            label: 'San Francisco',
            timeZone: 'America/Los_Angeles'
        },

        toronto: {
            label: 'Toronto',
            timeZone: 'America/Toronto'
        },

        vancouver: {
            label: 'Vancouver',
            timeZone: 'America/Vancouver'
        },

        mexico: {
            label: 'Mexico City',
            timeZone: 'America/Mexico_City'
        },

        'mexico city': {
            label: 'Mexico City',
            timeZone: 'America/Mexico_City'
        },

        'sao paulo': {
            label: 'São Paulo',
            timeZone: 'America/Sao_Paulo'
        },

        buenosaires: {
            label: 'Buenos Aires',
            timeZone: 'America/Argentina/Buenos_Aires'
        },

        'buenos aires': {
            label: 'Buenos Aires',
            timeZone: 'America/Argentina/Buenos_Aires'
        },

        honolulu: {
            label: 'Honolulu',
            timeZone: 'Pacific/Honolulu'
        }
    };

    function getWorldTimeContext(message) {
        const lower = message.toLowerCase();
        const references = [];

        /*
         * Only activate for questions that appear to ask
         * for the current time/date in another location.
         *
         * This deliberately does not trigger on ordinary
         * mentions of cities.
         */

        /*
         * JavaScript does not support the /x flag, so the
         * actual test is performed below with a compact regex.
         */
        const asksCurrentTime =
            /\b(?:what\s+(?:time|day|date)|what\s+is\s+the\s+(?:current\s+)?(?:time|day|date)|current\s+(?:time|day|date)|time\s+(?:is\s+it|right\s+now)|(?:time|date|day)\s+right\s+now)\b/.test(lower);

        if (!asksCurrentTime) {
            return '';
        }

        for (const [name, info] of Object.entries(
            WORLD_TIME_ZONES
        )) {
            const escapedName =
                name.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&'
                );

            const pattern =
                new RegExp(
                    '\\b' +
                    escapedName +
                    '\\b',
                    'i'
                );

            if (!pattern.test(lower)) {
                continue;
            }

            const formatter =
                new Intl.DateTimeFormat(
                    'en-US',
                    {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                        timeZoneName: 'short',
                        timeZone: info.timeZone
                    }
                );

            references.push(
                'Current time in ' +
                info.label +
                ': ' +
                formatter.format(new Date())
            );
        }

        return [
            ...new Set(references)
        ].join('\n');
    }

    /*
     * =========================================================
     * TIER 2
     * Conversation/session awareness
     * =========================================================
     */

    function getConversationContext(
        message,
        state,
        now
    ) {
        const lower =
            message.toLowerCase();

        const references = [];

        /*
         * How long was I gone?
         */
        if (
            /\bhow long\b/.test(lower) &&
            (
                /\baway\b/.test(lower) ||
                /\bgone\b/.test(lower) ||
                /\bleft\b/.test(lower) ||
                /\bwait\b/.test(lower) ||
                /\bwaited\b/.test(lower)
            )
        ) {
            if (state.lastTimestamp) {
                const elapsed =
                    formatElapsed(
                        now -
                        state.lastTimestamp
                    );

                if (elapsed) {
                    references.push(
                        'Time since your previous message: ' +
                        elapsed
                    );

                    references.push(
                        'Previous message: ' +
                        getDateTimeString(
                            state.lastTimestamp
                        )
                    );
                }
            }
        }

        /*
         * How long have we been talking?
         */
        if (
            (
                /\bhow long\b/.test(lower) ||
                /\bhow much time\b/.test(lower)
            ) &&
            (
                /\bconversation\b/.test(lower) ||
                /\bchat\b/.test(lower) ||
                /\btalking\b/.test(lower) ||
                /\bworking\b/.test(lower) ||
                /\bbeen\b/.test(lower)
            )
        ) {
            if (state.firstTimestamp) {
                const elapsed =
                    formatElapsed(
                        now -
                        state.firstTimestamp
                    );

                if (elapsed) {
                    references.push(
                        'Conversation duration: ' +
                        elapsed
                    );

                    references.push(
                        'Conversation started: ' +
                        getDateTimeString(
                            state.firstTimestamp
                        )
                    );
                }
            }
        }

        /*
         * What message number is this?
         */
        if (
            (
                /\bwhat\b/.test(lower) ||
                /\bwhich\b/.test(lower)
            ) &&
            (
                /\bmessage\b/.test(lower) ||
                /\bnumber\b/.test(lower)
            )
        ) {
            references.push(
                'Current message number: #' +
                state.messageNumber
            );
        }

        /*
         * When did the conversation start?
         */
        if (
            /\bwhen\b/.test(lower) &&
            (
                /\bconversation\b/.test(lower) ||
                /\bchat\b/.test(lower) ||
                /\bstart\b/.test(lower) ||
                /\bbegan\b/.test(lower)
            )
        ) {
            if (state.firstTimestamp) {
                references.push(
                    'Conversation started: ' +
                    getDateTimeString(
                        state.firstTimestamp
                    )
                );
            }
        }

        /*
         * Returning after a substantial gap.
         */
        if (
            state.lastTimestamp &&
            now -
            state.lastTimestamp >=
            RETURN_GAP_MS
        ) {
            references.push(
                'Conversation resumed after: ' +
                formatElapsed(
                    now -
                    state.lastTimestamp
                )
            );
        }

        if (!references.length) {
            return '';
        }

        return references.join('\n');
    }

    /*
     * =========================================================
     * Pending conversation state
     * =========================================================
     */

    function attachPendingState() {
        const id =
            getConversationId();

        if (!id) {
            return;
        }

        const realKey =
            STORAGE_PREFIX + id;

        try {
            const pending =
                localStorage.getItem(
                    PENDING_KEY
                );

            if (
                pending &&
                !localStorage.getItem(realKey)
            ) {
                localStorage.setItem(
                    realKey,
                    pending
                );

                localStorage.removeItem(
                    PENDING_KEY
                );

                console.log(
                    '[Lumo Clock] Conversation identified:',
                    id
                );
            }
        } catch (error) {
            console.log(
                '[Lumo Clock] Could not attach conversation state'
            );
        }
    }

    /*
     * =========================================================
     * Main injection
     * =========================================================
     */

    function injectTimestamp() {
        const composer =
            getComposer();

        if (!composer) {
            console.log(
                '[Lumo Clock] Composer not found'
            );

            return false;
        }

        const message =
            composer.value;

        if (!message.trim()) {
            return false;
        }

        const storageKey =
            getStorageKey();

        const state =
            getState(storageKey);

        const now =
            Date.now();

        /*
         * First message establishes the
         * conversation start.
         */
        if (!state.firstTimestamp) {
            state.firstTimestamp =
                now;
        }

        /*
         * Detect a new session.
         */
        if (
            state.lastTimestamp &&
            now -
            state.lastTimestamp >=
            RETURN_GAP_MS
        ) {
            state.sessionCount++;

            state.sessionStartTimestamp =
                now;
        }

        if (!state.sessionStartTimestamp) {
            state.sessionStartTimestamp =
                now;

            state.sessionCount = 1;
        }

        state.messageNumber++;

        const timestamp =
            getCurrentDateTime();

        const elapsed =
            formatElapsed(
                state.lastTimestamp
                    ? now -
                      state.lastTimestamp
                    : null
            );

        let header =
            timestamp +
            ' · #' +
            state.messageNumber;

        if (elapsed) {
            header +=
                ' · +' +
                elapsed;
        }

        /*
         * Tier 3.
         */
        const dateContext =
            getRelativeDateContext(
                message
            );

        /*
         * World time.
         */
        const worldTimeContext =
            getWorldTimeContext(
                message
            );

        /*
         * Tier 2.
         */
        const conversationContext =
            getConversationContext(
                message,
                state,
                now
            );

        const contextParts = [];

        if (dateContext) {
            contextParts.push(
                dateContext
            );
        }

        if (worldTimeContext) {
            contextParts.push(
                worldTimeContext
            );
        }

        if (conversationContext) {
            contextParts.push(
                conversationContext
            );
        }

        const context =
            contextParts.length
                ? '\n\n' +
                  contextParts.join('\n')
                : '';

        const finalMessage =
            header +
            '\n\n' +
            message +
            context;

        const setter =
            Object.getOwnPropertyDescriptor(
                HTMLTextAreaElement.prototype,
                'value'
            ).set;

        setter.call(
            composer,
            finalMessage
        );

        composer.dispatchEvent(
            new InputEvent('input', {
                bubbles: true,
                inputType: 'insertText',
                data: finalMessage
            })
        );

        state.lastTimestamp =
            now;

        saveState(
            storageKey,
            state
        );

        console.log(
            '[Lumo Clock] Injected:',
            header
        );

        if (dateContext) {
            console.log(
                '[Lumo Clock] Added date context:',
                dateContext
            );
        }

        if (worldTimeContext) {
            console.log(
                '[Lumo Clock] Added world-time context:',
                worldTimeContext
            );
        }

        if (conversationContext) {
            console.log(
                '[Lumo Clock] Added conversation context:',
                conversationContext
            );
        }

        return true;
    }

    /*
     * =========================================================
     * Navigation monitoring
     * =========================================================
     */

    function monitorNavigation() {
        let lastPath =
            location.pathname;

        function check() {
            if (
                location.pathname !==
                lastPath
            ) {
                lastPath =
                    location.pathname;

                attachPendingState();
            }
        }

        const originalPushState =
            history.pushState;

        history.pushState =
            function () {
                const result =
                    originalPushState.apply(
                        this,
                        arguments
                    );

                setTimeout(
                    check,
                    0
                );

                return result;
            };

        const originalReplaceState =
            history.replaceState;

        history.replaceState =
            function () {
                const result =
                    originalReplaceState.apply(
                        this,
                        arguments
                    );

                setTimeout(
                    check,
                    0
                );

                return result;
            };

        window.addEventListener(
            'popstate',
            function () {
                setTimeout(
                    check,
                    0
                );
            }
        );

        setInterval(
            check,
            500
        );
    }

    /*
     * =========================================================
     * Enter key
     * =========================================================
     */

    document.addEventListener(
        'keydown',
        function (event) {
            if (
                event.key !== 'Enter' ||
                event.shiftKey ||
                event.isComposing
            ) {
                return;
            }

            const composer = getComposer();

            if (!composer || event.target !== composer) {
                return;
            }

            injectTimestamp();
        },
        true
    );

    monitorNavigation();

    console.log(
        '[Lumo Clock] Version 3.7.1 loaded'
    );
})();
