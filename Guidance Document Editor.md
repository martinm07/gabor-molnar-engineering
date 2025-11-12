## Issues

- There is no ability to "discard local changes" in the component library editor.
- Some potential locations for elements are missing.
- Potential location elements are not ignored by the component library editor (because it is utilising `reconstructHTMLString()` directly which does not handle ignoring `potential-location` elements).
- ~~The selection highlight (still) sometimes doesn't show up (requiring a reload to restore).~~
- When adding an element in the component library editor, the current component appears in the list of what can be added for a second, before disappearing.
- In the document editor, it is possible to insert/move elements in between the parts of a component, breaking up its structure.
- In the document editor, there is no indication—when a component part is selected—the component it is a part of. There should be an additional outline around the overall component to make it clear to the user that this element is part of a larger, immutable unit.

## Current Checklist

- [x] Full editor undo/redo functionality
    - ~~Create undo/redo state history from MutationObserver callbacks~~
    - ~~Have other parts of the editor suggest state grouping~~
    - **POSTPONED:** Associate extra editor information
- [ ] Prevention of illegal HTML structures
    - Determine whether mutation resulted in illegal HTML structure
    - Use undo manager to automatically go back on illegal operations and create toast popup informing the error
    - BONUS: Have "relaxed" and "strict" modes of HTML structure validation
- [x] Component library editor
    - ~~URL management~~
    - ~~A back button (if coming from editing a document, make part of the URL?) and a save button for creating new library versions~~
    - ~~A method for navigating to different components in the library~~
    - ~~A method for modifying component metadata (name, description, tags)~~
    - Presets for container element to see how component behaves in each (e.g. `display: flex/block/inline`, `position: relative/absolute/static`)
- [x] Managing document component library version
    - ~~Detection of old component library version and displayed warning.~~
    - ~~Updating component instances in document upon updating library version ~~
- [ ] Managing document metadata 
    - (button on navbar that brings screen-wide popup for modifying title, description, tags, accent colour, thumbnail, and published status) probably using identical code as the popup for modifying component metadata
- [ ] Admin view of all guidance documents, creation of new ones, etc.
- [ ] Document media tray
    - Button on navbar that brings up little view of media files with thumbnails
    - Clicking media thumbnail copies the path to clipboard.
    - Ability to upload and delete media files
- [ ] Floating UI at cursor position activated through keyboard shortcuts for colour picking and media tray file URL insertion
	- The colour picker should also have the option of managing a colour palette (which then needs to be saved on the document in document editor mode and as a special component in component library editor mode. Palette colours should also appear when in documents that inherit the library).
- [ ] Node hierarchy view

## Current Plans

I will ignore current issues with the CSS Editor undo/redo system, as the whole thing pretty much needs to be re-done to integrate with full editor undo/redo functionality. 
The idea for this is to involve mutation records from the MutationObserver and document patch syncing functionality to efficiently store changes to the document HTML string in local browser memory. This can be used to recover previous document states by simply applying the reverse of the patch to find a previous HTML document string and reinterpret that to refresh the document to the previous state. This is of course a pretty expensive operation, and the hope is that undo/redo is a feature used sparingly. It is mainly important for being able to backtrack illegal DOM operations, and for large, destructive user operations.
There may be the possibility of making it more efficient, since we could be able to determine *what* a string patch is trying to do (change attributes, text content, adding nodes, removing them), and we can use that to engineer direct DOM manipulations for undo/redo.
However it is done, this saved history of document states can have extra information hooked into it. For example, the CSS Editor may say that it has just performed an edit, and this is where the caret was when it happened, and so when the MutationObserver picks up on a mutation for the selected elements modifying style, we'll know to associate the information, and use that when restoring state so that things like caret position and element focus can also be restored.
There is a concern of how to exactly identify mutations as "coming from" certain sources reliably.
In fact, we can simply store global state that lasts until the next JavaScript event cycle (after the microtask queue with MutationObserver callbacks have been called) when any part of the editor wants to associate some extra information. This is because *the editor can only ever be in one state at any given time.* When the MutationObserver callbacks fire, we check if any part of the editor has any extra information to associate, and whether there has been any suggestions to group the current edit with the last edit.

However, after resolving the other issues the focus will be on implementing the component library editor, and management of component library version on documents.

Then I will probably move on to doing the undo/redo functionality and HTML structure validation.

Then I will probably move on to implementing document metadata management (there are some important considerations about saving past versions of documents and how it relates to being published).

Then it will be the media tray.

Finally, it will be the admin view.

I am considering the "node hierarchy view" a bonus, as I intend the main way of selecting elements being visual.
There are also other nice-to-haves, like for the CSS editor a colour picker (colour management in general is a big if), context-aware keyboard shortcut window in bottom-left, document preview mode, "Shift-S" multiple select, more expansive autocomplete (CSS property values, attribute values), but after everything else I'm not sure I'll want to bother...

The big expansion after everything will be "macros". Here was my initial idea for them:
> Macros are here to introduce the high-level functionality seen in a lot of WYSIWYG editors. It is essentially just a system for defining shortcuts to common actions (e.g. making some text bold). They can appear as keyboard shortcuts, icons in the top navigation bar, or fields on components

It would essentially involve creating a JavaScript API for the document editor, implementing a web-based JavaScript editor (probably using a third-party library), implementing keyboard shortcut customisation, icon customisation, etc. and somehow involving them in component library versioning.

At this point though, I think it is fine to call the editor complete without macros implemented.

## Thoughts Board

### History Manager

**Think through possibilities of other stringPos values in DOM patches getting incorrectly mapped**

`backStart` values need to be mapped from OLD `stringPos` -> NEW `stringPos`
...for patches that are being merged into.

We do NOT map values that no longer "have a place" in the new HTML string.

These are of course the nodes that have been removed by the latest set of patches. Thus, the patch that removed a node (and so has a technical string length of 0 in the new HTML string) won't be mapped (instead, it'll be mapped to the BASE HTML string), and we don't have a problem.

We determine if a `backStart` value cannot be mapped ONCE, when the node has a non-0 length in the previous HTML string, so if that `stringPos` doesn't have an entry in the new HTML string we are guaranteed that indeed it got removed by the latest of patches; thus no longer "has a place". This logic is sound.

What about patches that add a node? These could be said to have a string length of 0 in the previous HTML string.
――> Luckily, these patches don't refer to the insertion location of the node, but rather to the `stringPos` of the node that precedes it, which of course always has non-0 length, and so there's no need to worry that they will get misidentified by a map, forwards nor backwards.

The reason `forwardStart` remove-type patches *SPECIFICALLY* were vulnerable to this is because the `forwardUpdateMap` was keyed in the latest version of the HTML string, where these patches represented nodes that didn't have a place in that string.

The `backwardUpdateMap` is keyed in the previous version of the HTML string.
Add-type patches always refer to a node that exists in the new HTML string. The `forwardUpdateMap` which is keyed in the new HTML string is satisfied by this. The `backwardUpdateMap` is keyed in the previous HTML string, but is only applied to the patches when they do indeed become the "previous HTML string".

