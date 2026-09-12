Lumo Time Context

A browser userscript that adds reliable date and time context to Lumo
conversations, along with conversation timing and message statistics.

The script uses the browser's local date/time and time-zone information
rather than relying on Lumo to determine the current time. Time-zone
calculations are performed locally in the browser and do not require an
external time service.

Features

Adds the current local date and time to Lumo conversations.

Numbers messages within a conversation.

Records elapsed time between messages.

Tracks basic conversation timing and message statistics.

Keeps conversation timing information available between visits using
browser localStorage.

Resolves relative dates such as today, yesterday, and
tomorrow using the actual current date.

Determines the current date and time for supported cities and time
zones.

Correctly handles daylight-saving time and date changes between
locations.

Supports requests involving multiple locations.

Performs time and date calculations locally in the browser.

Does not require a connection to an external clock or time API.

Requirements

An account with Lumo

A modern web browser with JavaScript enabled.

A userscript manager such as Violentmonkey or Tampermonkey.
Violentmonkey is recommended for this project.

Browser and Platform Compatibility

The script has been tested on:

Firefox on Linux

It may also work on other browsers and operating systems that support a
compatible userscript manager and the browser features used by the
script.

Potentially compatible environments include:

Firefox on Windows, macOS, and Linux

Chrome on Windows, macOS, and Linux

Microsoft Edge on Windows, macOS, and Linux

Chromium-based browsers such as Brave and Vivaldi

Safari on macOS

Firefox on Android

Other browsers supported by the chosen userscript manager

These platforms are not necessarily tested. Compatibility can also
depend on the version of Lumo, the browser, and the userscript manager.

Violentmonkey supports WebExtension-compatible browsers including
Chrome, Firefox, Edge, Opera, Vivaldi, Brave, and others.

If you use a browser or platform other than Firefox on Linux, consider
the installation and compatibility information above as expected
compatibility, not a tested configuration.

Recommended Userscript Manager

Violentmonkey

Violentmonkey is the recommended
userscript manager for this project.

There are several reasons for that recommendation:

Open source: Violentmonkey's source code is publicly available
on GitHub, allowing its implementation to be inspected and reviewed.

Broad browser support: It works with browsers that support
WebExtensions, including Firefox, Chrome, Edge, Chromium, Brave,
Opera, Vivaldi, and others.

Good userscript compatibility: Violentmonkey supports most
scripts written for Greasemonkey and Tampermonkey.

Import and export: Scripts can be imported and exported, making
it easier to back up or move a userscript collection.

Local control: Scripts are managed directly through the browser
extension, without requiring a separate hosted service for normal
script installation and use.

No advertising in the extension: Violentmonkey does not contain
advertising, and webpage changes are made by the userscripts the
user installs.

Public development: The project is maintained publicly on
GitHub, with its source, issues, releases, and development process
available for inspection.

Violentmonkey is not required. Tampermonkey and other compatible
userscript managers should also be capable of running this script.

The recommendation is based primarily on open-source availability,
browser compatibility, script portability, and user control, rather than
a claim that other userscript managers are inherently insecure.

Installing Violentmonkey

Violentmonkey is available through several browser extension stores as
well as from its GitHub releases.

Official installation options are listed on the Violentmonkey
website.

After installing Violentmonkey:

Open the Violentmonkey dashboard.

Create a new userscript.

Replace the default contents with the contents of the Lumo Time
Context .user.js file.

Save the script.

Open or reload Lumo.

The script should then run automatically when its URL matching rules
match the Lumo page.

Installation with Tampermonkey

Tampermonkey is another widely used userscript manager and can also run
this script.

Install Tampermonkey for your browser,
then:

Open the Tampermonkey dashboard.

Create a new userscript.

Replace the default contents with the contents of the Lumo Time
Context .user.js file.

Save the script.

Open or reload Lumo.

Basic Testing

After installation, start a new Lumo conversation and try:

What time is it?

The conversation should contain a current-time annotation supplied by
the userscript.

You can also test another location:

What time is it in London?

The response should correspond to the current London time, including the
correct daylight-saving offset when applicable.

Multiple locations

Try:

What time is it in London, Tokyo, and New York?

The script should provide current date/time information for each
recognized location.

Date changes

A useful test is to request locations that are on opposite sides of the
International Date Line or otherwise have different calendar dates.

For example:

What time is it in Los Angeles and Tokyo?

The supplied date should change when the local date in the requested
location differs from the user's local date.

Conversation Timing

The script adds message numbers to the conversation.

For example:

#1

and:

#2 · +18s

The message number identifies the message's position in the
conversation. The elapsed-time value indicates the approximate time
since the preceding message.

The script also maintains basic conversation timing and message
statistics.

Relative Dates

The script provides the current date so that relative dates can be
resolved against the actual date rather than relying on Lumo's
assumptions.

Examples include:

What day is tomorrow?

What date was yesterday?

What date is it today?

This is particularly useful around midnight, when the calendar date
changes.

Time Zones

Time-zone calculations are performed by the browser using its built-in
internationalization and time-zone support.

This allows the script to account for:

Standard time

Daylight-saving time

Different UTC offsets

Calendar-date changes

Locations that are currently on different dates

No external time server is required.

Supported Locations

The script recognizes a range of commonly requested cities and
locations, including:

London

Tokyo

Paris

Berlin

Madrid

Rome

Amsterdam

Dublin

Lisbon

Reykjavik

Seoul

Beijing

Shanghai

Hong Kong

Singapore

Bangkok

Delhi

Mumbai

Dubai

Sydney

Melbourne

Perth

Auckland

New York

Chicago

Denver

Los Angeles

San Francisco

Toronto

Vancouver

Mexico City

São Paulo

Buenos Aires

Honolulu

The list can be expanded as needed.

Browser Storage

Conversation timing and message statistics are stored in the browser
using localStorage.

This allows information such as message counts and timing statistics to
persist between page reloads and browser sessions.

Browser privacy settings can affect this behavior. If the browser is
configured to remove site data when it closes, localStorage data may
also be removed unless Lumo has been excluded from that cleanup.

The script does not require an external database or account to maintain
these statistics.

Privacy and Security

What this script does

The script runs in your browser on the Lumo website. It adds information
to the Lumo conversation and maintains some conversation statistics
locally.

Time and date calculations are performed locally in the browser. The
script does not need to contact an external time service to determine
the current time or convert between time zones.

The message counts, elapsed-time information, and other statistics
maintained by the script are stored locally in browser storage.

What the script can access

Because this is a userscript running on the Lumo website, it can
interact with the Lumo page and the information available to JavaScript
on that page.

That is necessary for the script to observe messages, add time
information, and maintain conversation state.

A userscript should therefore be treated as software with access to the
pages on which it is allowed to run. Userscript managers themselves can
also require broad browser permissions because they need to be capable
of injecting scripts into matching websites.

What the script does not need

This script does not need an external time API.

It does not need to send conversation data to a separate server in order
to perform its time-zone calculations.

It does not need an external database to maintain its message
statistics.

The absence of an external time service reduces the amount of
third-party communication required by the script.

Overall risk

For this particular script, the additional privacy and security risk is
relatively small, provided that the source code is trusted and the
script is not modified to add network requests or other data collection.

The main security consideration is the userscript mechanism itself: a
userscript can read or modify webpage content on the sites where it is
permitted to run. This is why users should review userscripts before
installing them and should only install scripts from sources they trust.

The important distinction is between:

The capabilities available to the userscript manager.

What this particular script actually does with those capabilities.

This project is intended to keep the second category as limited as
practical.

Userscript manager considerations

The userscript manager is separate software from this userscript.

Its permissions and privacy practices should therefore be evaluated
separately from the behavior of this project.

If privacy is a primary concern, review both:

The source code of this userscript.

The permissions and privacy information for the userscript manager
you choose.

You can also inspect the browser's developer tools and network activity
if you want to verify whether a script is making external requests.

How It Works

The script runs in the Lumo page and observes the conversation as
messages are entered.

It maintains state for the current conversation and adds contextual
information such as:

Current time in Paris: Saturday, September 12, 2026 at 9:17:23 PM GMT+2

When a location is requested, the script determines the appropriate time
zone and uses the browser's date/time facilities to calculate the local
date and time.

Because the calculation is performed in the browser, the result does not
depend on an external clock API being available.

Conversation state is associated with the individual conversation so
that message numbering and elapsed-time calculations remain consistent
within that conversation.

Limitations

The script supplies date and time information to Lumo; it does not
control how Lumo chooses to interpret or describe that information.

The list of recognized locations is finite. A location that is not
recognized may not receive a time annotation.

Browser time-zone data and the system clock are used as the basis for
local calculations. An incorrect system clock or outdated browser
time-zone data can therefore affect the result.

Browser storage behavior is controlled partly by the browser's privacy
and site-data settings.

Compatibility with browsers and platforms other than the tested
configuration has not been verified.

Troubleshooting

The script does not appear to run

Check that:

The userscript manager is installed and enabled.

The Lumo userscript is enabled.

The script's URL matching rules include the current Lumo page.

The Lumo page has been reloaded after installing or updating the
script.

No other userscript is interfering with the page.

Message counts or timing statistics disappear

Check the browser's site-data and privacy settings.

If site data is automatically cleared when the browser closes,
localStorage data may also be removed unless Lumo has been excluded
from that cleanup.

A location is not recognized

The script only handles locations included in its location/time-zone
mapping. Check the supported-location list or add the desired location
to the mapping in the source code.

The displayed time is wrong

First check the computer's system date, system time, and time-zone
settings.

The script uses the browser's time and time-zone facilities, so an
incorrect system clock can produce an incorrect result.

Development

The script is a single browser userscript and can be edited directly in
a userscript manager.

When making changes, test at least:

A new conversation

Multiple messages in the same conversation

Message-number increments

Elapsed-time calculations

A location in the same time zone

A location in a different time zone

Daylight-saving time

A location on a different calendar date

Multiple locations in one request

Browser reloads

New browser sessions

Persistence of localStorage data

For time-related changes, testing around a local midnight or a time-zone
date boundary is especially useful.

License



Disclaimer

This project is an independent browser userscript and is not affiliated
with or endorsed by Proton or Lumo.
