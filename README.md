![Note Gallery Example](assets/github-header.png)

# What is it?
Note Gallery is a masonry style note gallery for [Obsidian](https://obsidian.md/).

- This plugin is currently in early alpha testing. It's functional but may contain some bugs.
- Please feel free to leave any bugs or feature requests in issues.

[![GitHub Sponsors](https://img.shields.io/github/sponsors/pashashocky?style=social)](https://github.com/sponsors/pashashocky)
[<img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="BuyMeACoffee" width="100">](https://www.buymeacoffee.com/pashashocky)

# Functionality
## Current
- Displays notes or images using a masonry gallery by defining a code block in your note. Similar to "Safari overview mode" or "Craft-like folder view".
  - [x] Opimized the loading of markdown cards through caching.
  - [x] CRUD operations update the gallery.
- Variety of filtering and searching options
  - [x] `query` supports native obsidian search syntax! For example:
    - `query: '/(Regex: \d)/'`
    - `query: tag:#mytag`
    - `query: 'path: abc/deb OR path: atlas/notes'`
    - `query: path:abc/deb OR path:atlas/notes` - notice the spacing differences without quotes
  - [x] `path` can be used to select an individual folder or recursively collect it
- Has options for sorting, limiting # of results and recursively scanning folders.

## Work in Progress
- Actively working through issues.
- Interactive view when clicking on folders in the file switcher.
- Showing currently open tabs as a Masonry gallery.

## Quickstart
To get an idea of how syntax works, create a new blank note and copy/paste this entire syntax block into the note. Your masonry layout should show up right away. In this example, it will show your most recent 9 notes. If they do not show up immediately, create a new line in your note outside of the syntax block.

When copying and pasting, be sure to include all 4 `~` characters at the beginning and all 4 `~` characters at the end of the syntax block.

```
~~~~note-gallery
sort: desc
limit: 9
~~~~
```

## Example Syntax
```
~~~~note-gallery     #           default | options
query: 'tag:#mytag'  # optional: anything you'd put into an obsidian search query
                     # make sure to wrap into single quotes for any regex e.g.: '/\d/'
debugQuery: false    # optional: false | true - display native search results to debug
path: atlas          # optional: current note folder | path/to/folder - you don't **need**
                     # to use path if you are using query, path will source additional notes
recursive: true      # optional: true | false
limit: 10            # optional: 0 | any number
sort: desc           # optional: desc | asc
sortBy: mtime        # optional: mtime | ctime | name
fontSize: 6pt        # optional: 6pt | NUMBERpt | NUMBERpx
showTitle: true      # optional: true | false
~~~~
```

# Installation Instructions
## Community Plugin
I've submitted an application to be included in obsidian community plugins - [show some love](https://github.com/obsidianmd/obsidian-releases/pull/2684)

## BRAT
1. Install BRAT from the Community Plugins in Obsidian
  1.1 Enable the BRAT plugin in the settings
2. Open the command palette (CMD/CTRL + P) and run the command BRAT: `Add a beta plugin for testing`
3. Enter the following URL: `https://github.com/pashashocky/obsidian-note-gallery`
4. Enable the `Note Gallery` plugin in the `Community Plugins` tab in settings
5. Create a code block similar to the below in any of your notes
