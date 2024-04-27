let removedElements = [];

const observer = new MutationObserver(() => {
    if (!localStorage.getItem("No Emoji")) {
        // If NoMoji is not set, bring back the removed elements
        removedElements.forEach(({ element, parent }) => parent.appendChild(element));
        removedElements = [];
    } else {
        const emojiButtons = document.querySelectorAll('.message-tool.button.emoji-button');
        emojiButtons.forEach(button => {
            // Keep a reference to the removed elements and their parent nodes
            removedElements.push({ element: button, parent: button.parentNode });
            button.remove();
        });
    }
});

observer.observe(document, { childList: true, subtree: true });