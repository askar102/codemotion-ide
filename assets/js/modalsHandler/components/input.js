import { createDIV, createSpan } from "../handlers/helpers.js"

export function renderInput(properties = {}) {
    const id = properties.id
    const title = properties.title
    const description = properties.description
    const placeholder = properties.placeholder

    const wrapper = document.createElement("div")
    wrapper.classList.add("modal-category__item")

    const elementTitle = document.createElement("div")
    elementTitle.classList.add("modal-category__item-title")
    elementTitle.textContent = title

    const elementDesc = document.createElement("div")
    elementDesc.classList.add("modal-category__item-desc")
    elementDesc.textContent = description

    const inputWrapper = createDIV()
    inputWrapper.classList.add("form-element")

    const input = document.createElement("input")
    input.type = "text"
    input.spellcheck = "false"
    input.id = id

    const inputName = createSpan()
    inputName.classList.add("form-label")
    inputName.textContent = placeholder

    inputWrapper.appendChild(input)
    inputWrapper.appendChild(inputName)

    if(title) wrapper.appendChild(elementTitle)
    if(description) wrapper.appendChild(elementDesc)
    if(!placeholder) inputName.textContent = title

    wrapper.appendChild(inputWrapper)

    input.addEventListener("input", (e) => {
        if (e.target.value.length > 0) {
            input.classList.add("focused")
        }
        else {
            input.classList.remove("focused")
        }
    })

    return wrapper
}