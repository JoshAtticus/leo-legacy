let removedPlaceholders = [];

const observer = new MutationObserver(() => {
    if (!localStorage.getItem("No Placeholders")) {
        // If NoMoji is not set, bring back the removed elements
        removedPlaceholders.forEach(({ element, parent }) => parent.appendChild(element));
        removedPlaceholders = [];
    } else {
        const emojiButtons = document.querySelectorAll('#attach');
        emojiButtons.forEach(button => {
            // Keep a reference to the removed elements and their parent nodes
            removedPlaceholders.push({ element: button, parent: button.parentNode });
            button.remove();
        });
    }
});

observer.observe(document, { childList: true, subtree: true });