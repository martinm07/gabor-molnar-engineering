/**
 * Determines if appending a child node to a parent at a specific position would create invalid HTML.
 * Uses browser parsing behavior as source of truth for validation rules.
 */
function isValidInsertion(
  parent: Node,
  child: Node,
  insertionIndex: number,
): boolean {
  // Quick checks for obviously invalid cases
  if (!parent || !child) return false;
  if (
    parent.nodeType !== Node.ELEMENT_NODE &&
    parent.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
  )
    return false;
  if (insertionIndex < 0 || insertionIndex > parent.childNodes.length)
    return false;

  // Text nodes and comments are generally safe (with some exceptions we'll check)
  if (
    child.nodeType === Node.TEXT_NODE ||
    child.nodeType === Node.COMMENT_NODE
  ) {
    return isTextContentValid(parent as Element, child);
  }

  // Only validate element nodes from here
  if (child.nodeType !== Node.ELEMENT_NODE) return true;

  const parentElement = parent as Element;
  const childElement = child as Element;

  // Create a test scenario to check browser parsing behavior
  return validateWithBrowserParsing(
    parentElement,
    childElement,
    insertionIndex,
  );
}

/**
 * Uses browser's HTML parser to validate if a structure would be valid.
 * This is future-proof as it relies on the browser's own parsing rules.
 */
function validateWithBrowserParsing(
  parent: Element,
  child: Element,
  insertionIndex: number,
): boolean {
  try {
    // Create a minimal test document structure
    const testContainer = document.createElement("div");

    // Clone the parent and a simplified version of its context
    const testParent = createTestContext(parent);
    testContainer.appendChild(testParent);

    // Create a simplified version of the child for testing
    const testChild = createTestElement(child);

    // Get the current HTML structure
    const childNodes = Array.from(testParent.childNodes);

    // Insert test child at the specified position
    if (insertionIndex >= childNodes.length) {
      testParent.appendChild(testChild);
    } else {
      testParent.insertBefore(testChild, childNodes[insertionIndex]);
    }

    // Get the HTML representation
    const htmlBefore = testContainer.innerHTML;

    // Parse it back and compare structure
    const reparsedContainer = document.createElement("div");
    reparsedContainer.innerHTML = htmlBefore;

    // Check if the structure is preserved after round-trip parsing
    return isStructurePreserved(testContainer, reparsedContainer);
  } catch (error) {
    // If any error occurs during testing, assume invalid
    return false;
  }
}

/**
 * Creates a test context that includes relevant ancestor information
 * without cloning the entire document tree.
 */
function createTestContext(element: Element): Element {
  const testElement = document.createElement(element.tagName);

  // Copy critical attributes that affect content model
  const criticalAttrs = ["contenteditable", "role", "aria-label"];
  criticalAttrs.forEach((attr) => {
    if (element.hasAttribute(attr)) {
      testElement.setAttribute(attr, element.getAttribute(attr)!);
    }
  });

  // Include simplified versions of existing children to maintain context
  const existingChildren = Array.from(element.childNodes);
  existingChildren.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const simpleChild = document.createElement((child as Element).tagName);
      testElement.appendChild(simpleChild);
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      testElement.appendChild(document.createTextNode("text"));
    }
  });

  // Wrap in ancestor context if there are interactive elements above
  return wrapInInteractiveContext(element, testElement);
}

/**
 * Wraps the test element in relevant ancestor context,
 * particularly for interactive element constraints.
 */
function wrapInInteractiveContext(
  original: Element,
  testElement: Element,
): Element {
  let current = original.parentElement;
  let wrapper = testElement;

  // Look up the ancestor chain for interactive elements
  while (current && current !== document.body) {
    if (isInteractiveElement(current)) {
      const ancestorWrapper = document.createElement(current.tagName);
      ancestorWrapper.appendChild(wrapper);
      wrapper = ancestorWrapper;
      break; // One level of interactive ancestor is enough for testing
    }
    current = current.parentElement;
  }

  return wrapper;
}

/**
 * Creates a simplified test version of an element that preserves
 * structure-relevant characteristics without full content.
 */
function createTestElement(element: Element): Element {
  const testElement = document.createElement(element.tagName);

  // Copy attributes that affect parsing behavior
  const structuralAttrs = ["type", "role", "contenteditable"];
  structuralAttrs.forEach((attr) => {
    if (element.hasAttribute(attr)) {
      testElement.setAttribute(attr, element.getAttribute(attr)!);
    }
  });

  // Include representative descendants, particularly interactive ones
  const descendants = element.querySelectorAll("*");
  let hasInteractiveDescendant = false;

  for (const descendant of descendants) {
    // TODO: Added an "instanceof HTMLElement" check because isInteractiveElement requires
    //        the tabIndex property (only present on HTMLElements). This may not be the right
    //        way to fix it though.
    //        Well, it *is* pure LLM code. Dunno how good it is.
    if (descendant instanceof HTMLElement && isInteractiveElement(descendant)) {
      const testDescendant = document.createElement(descendant.tagName);
      testElement.appendChild(testDescendant);
      hasInteractiveDescendant = true;
      break; // One interactive descendant is enough for testing
    }
  }

  // If no interactive descendants, add a simple text node to test content model
  if (!hasInteractiveDescendant && element.children.length === 0) {
    testElement.appendChild(document.createTextNode("test"));
  }

  return testElement;
}

/**
 * Checks if two DOM structures are equivalent after HTML parsing round-trip.
 */
function isStructurePreserved(original: Element, reparsed: Element): boolean {
  // Compare the structure by examining the tree shape and critical elements
  const originalStructure = getStructureSignature(original);
  const reparsedStructure = getStructureSignature(reparsed);

  return originalStructure === reparsedStructure;
}

/**
 * Creates a signature representing the essential structure of a DOM tree.
 */
function getStructureSignature(element: Element): string {
  const signature: string[] = [];

  function traverse(node: Node, depth: number) {
    const indent = "  ".repeat(depth);

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      signature.push(`${indent}<${el.tagName.toLowerCase()}>`);

      // Traverse children
      Array.from(node.childNodes).forEach((child) => {
        traverse(child, depth + 1);
      });
    } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      signature.push(`${indent}#text`);
    }
  }

  traverse(element, 0);
  return signature.join("\n");
}

/**
 * Determines if an element is interactive based on HTML5 specification.
 * Uses feature detection to be future-proof.
 */
function isInteractiveElement(element: HTMLElement): boolean {
  // Use the browser's built-in interactive element detection
  // This is more future-proof than maintaining a hardcoded list

  // Check if element can receive focus (primary indicator of interactivity)
  const canFocus =
    element.tabIndex >= 0 ||
    (element as HTMLElement).contentEditable === "true" ||
    hasImplicitFocus(element);

  // Check for form controls and other interactive elements
  const hasInteractiveRole =
    element.getAttribute("role") === "button" ||
    element.getAttribute("role") === "link" ||
    element.getAttribute("role") === "textbox";

  return canFocus || hasInteractiveRole;
}

/**
 * Checks if an element has implicit focus capability.
 */
function hasImplicitFocus(element: Element): boolean {
  // Use instanceof checks which are more reliable than tagName comparisons
  return (
    element instanceof HTMLAnchorElement ||
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLDetailsElement ||
    (element instanceof HTMLElement && element.draggable)
  );
}

/**
 * Validates if text content is appropriate for the given parent element.
 */
function isTextContentValid(parent: Element, textNode: Node): boolean {
  // Some elements don't allow text content
  if (
    parent instanceof HTMLTableElement ||
    parent instanceof HTMLTableSectionElement ||
    parent instanceof HTMLTableRowElement ||
    parent instanceof HTMLSelectElement
  ) {
    return textNode.textContent?.trim() === "";
  }

  return true;
}

/**
 * Public API function with additional validation and error handling.
 */
export function canInsertChild(
  parent: Node,
  child: Node,
  position: number = -1,
): boolean {
  try {
    // If position is -1, default to appending at the end
    const insertionIndex =
      position === -1 ? parent.childNodes.length : position;

    return isValidInsertion(parent, child, insertionIndex);
  } catch (error) {
    console.warn("Error during HTML validation:", error);
    return false;
  }
}

// Example usage:
/*
const parentDiv = document.querySelector('#parent') as Element;
const childButton = document.createElement('button');

if (canInsertChild(parentDiv, childButton)) {
  parentDiv.appendChild(childButton);
} else {
  console.log('Invalid insertion - would create malformed HTML');
}
*/
