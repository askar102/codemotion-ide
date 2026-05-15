import { createDIV } from "../handlers/helpers.js"

export function renderButton(properties = {}) {
    const id = properties.id
    const title = properties.title
    const container = properties.container
    const element = properties.element

    const button = document.createElement("button")
    button.id = id
    button.classList.add("modal-button")
    button.textContent = title

    if(!title) button.textContent = id

    if(!container) {
        return button
    }
    else {
        const containerEl = element.querySelector(container)

        if(containerEl) {
            containerEl.classList.add("modal-buttons")
            containerEl.appendChild(button)

            return containerEl
        }
    }
}