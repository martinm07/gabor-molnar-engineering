## Issues

- CSSEditor undo/redo: Edits made in multiple selections are forgotten when editing nodes individually. 
  This behaviour is unintuitive, but hard to overcome. Each edit would require computing the CSS string for each element in the selection individually to find the full CSS styles that can have state added to. Then, if we really don't want CSS edit history to be dependent on the selection- only the elements themselves- then we must somehow construct an edit history from the individual histories for multiple selections. This would involve constructing a history as far back as possible where the *changes* made to each element of the selection are still identical. For example, the latest states in every element may involve adding `color: red;`, the state before that may also be the same for every element, being removing `display: block;`, or changing `position: relative;` to `position: absolute;`, etc.
  **Basically, we want the intersection of any shared undo history.**
  This of course involves finding the *changes* in state, which should be impervious to changes that don't affect the style calculation e.g. changing the order of properties. This is something which has not yet been implemented.
- CSS Editor undo/redo: When undoing, the autocomplete menu does strange things, seemingly trying to autocomplete the first parameter name. This causes unexpected stealing of control from keyboard cursor navigation.
- ~~CSS Editor: Pressing "backspace" on a line with 3 or less characters (e.g. `a:;`) that is in the middle of 2 other CSS properties messes up the structure: the property name of the following line becomes part of the property value pf the preceding line.~~
- ~~Tag name editor: When it live refreshes the element, focus doesn't return back to the input.
  In general, changing the tag name is a rather destructive action (it can remove attributes, change styles and so on), thus it shouldn't live update, but have some confirmation button.~~
- ~~Tag name editor/attribute editor: When the tag name is updated (involving the creation and deletion of an element), the attribute masks are lost.~~
- ~~Attribute editor: Selection of multiple elements may cause some attributes to clone onto elements where they are not supposed to be~~
- ~~CSS Editor: CSSUtilities.js doesn't recognize rules in CSS @layer at-rules.
  Now that in Tailwind V4 all the styles are in layers, and the user-agent styles are also in layer just to remain lower precedence, this is a big deal. It essentially means that the whole `handlecss.ts` file doesn't so anything, because there's no interesting styles it can find to show as initial element styles.~~
- ~~Document patch syncing: Doesn't ignore `potential-location` elements when they are inserted for adding/moving nodes, causing a lot of unnecessary network traffic~~
- ~~Document patch syncing: Doesn't utilize attribute masks to not sync "`draggable`" or "`contentEditable`" when they are used for editor functionality~~
- ~~Document patch syncing: Interprets `textContent` of nodes in `characterData` mutations as HTML, instead of escaping the strings. The same may also be an issue with `attribute` mutations.
  There is a library called "[he](https://www.npmjs.com/package/he)" that can be used to address this.~~

## Current Checklist

- [ ] Full editor undo/redo functionality
    - Create undo/redo state history from MutationObserver callbacks
    - Associate extra editor information and have other parts of the editor suggest state grouping
- [ ] Prevention of illegal HTML structures
    - Determine whether mutation resulted in illegal HTML structure
    - Use undo manager to automatically go back on illegal operations and create toast popup informing the error
    - BONUS: Have "relaxed" and "strict" modes of HTML structure validation
- [ ] Component library editor
    - URL management
    - A back button (if coming from editing a document, make part of the URL?) and a save button for creating new library versions
    - A method for navigating to different components in the library
    - A method for modifying component metadata (name, description, tags)
    - Presets for container element to see how component behaves in each (e.g. `display: flex/block/inline`, `position: relative/absolute/static`)
- [ ] Managing document component library version
    - Detection of old component library version and displayed warning.
    - Updating component instances in document upon updating library version 
- [ ] Managing document metadata 
    - (button on navbar that brings screen-wide popup for modifying title, description, tags, accent colour, thumbnail, and published status) probably using identical code as the popup for modifying component metadata
- [ ] Admin view of all guidance documents, creation of new ones, etc.
- [ ] Document media tray
    - Button on navbar that brings up little view of media files with thumbnails
    - Clicking media thumbnail copies the path to clipboard.
    - Ability to upload and delete media files
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