import { Modal } from "../modalsHandler/engine.js"
import { createNotify, getInitials, Options, truncateString } from "../lib.js"
import { sendEvent } from "../bus.js"

export async function createUserOrgsModalStructure({ gls, userOrgs, userJSON, roleVisible }) {
    roleVisible = roleVisible == undefined ? true : roleVisible

    const organizationsModalData = await Promise.all(
        userOrgs.map(async (organization) => {
            const organizationReq =
                await window.electron.getOrgDataFromAPI(organization.id)

            if (!organizationReq.success) {
                throw new Error(
                    `Error getting organization data: ${organization.id}`
                )
            }

            const organizationData = organizationReq.msg

            const organizationRole =
                organization.role?.length > 0
                    ? organization.role
                    : "No role"

            const isOwner = organizationData.is_owner

            const preparedData = {
                type: "organization",

                name: organizationData.name,

                description:
                    organizationData.description,

                website:
                    organizationData.website,

                columns: [
                    {
                        name: gls.get(
                            "modals.organizations.membersLabel"
                        ),

                        value:
                            organizationData.members_count
                    },

                    {
                        name: gls.get(
                            "modals.organizations.roleLabel"
                        ),

                        value: isOwner
                            ? gls.get(
                                "modals.organizations.ownerRoleLabel"
                            )
                            : organizationRole
                    }
                ],

                badgeOwner: isOwner,

                badgeVerified:
                    organizationData.verified == 1
            }

            if(!roleVisible) {
                delete preparedData["columns"][1]
            }

            if (isOwner) {
                preparedData.note = `
                    ${gls.get("modals.organizations.ownerLabel")}
                    ${
                        organization.role?.length > 0
                            ? gls.get(
                                "modals.organizations.ownerLabel",
                                {
                                    role: organization.role
                                }
                            )
                            : ""
                    }
                `
                    .trim()
            }

            return preparedData
        })
    )

    return organizationsModalData
}

export async function createUserOrgModal({ gls, userOrgs, userJSON }) {
    function lgls(string, variables = {}) {
        return gls.get(`modals.organizations.${string}`, variables)
    }

    const exploreOrganizationsRes = await window.electron.requestExploreOrganizations()

    const errorPlaceholder = {
        type: "placeholder",
        title: gls.get("errorPlaceholder.title"),
        description: gls.get("errorPlaceholder.description")
    }

    let exploreItems = []
    let membershipItems = []

    if(exploreOrganizationsRes.success) {
        if(exploreOrganizationsRes.msg.length == 0) {
            exploreItems = [
                {
                    type: "centered",
                    icon: "explore"
                }
            ]
        }
        else {
            exploreItems = await createUserOrgsModalStructure({ gls: gls, userOrgs: exploreOrganizationsRes.msg, userJSON: userJSON, roleVisible: false })
        }
    }
    else {
        exploreItems = [errorPlaceholder]
    }

    if(Object.keys(userOrgs).length == 0) {
        membershipItems = [
            {
                type: "centered",
                icon: "group"
            }
        ]
    }
    else {
        membershipItems = await createUserOrgsModalStructure({ gls: gls, userOrgs: userOrgs, userJSON: userJSON })
    }

    const orgModal = Modal.create({
        id: "organizations",
        name: "Organizations",
        modalClassList: ["window"],
        title: lgls("title"),

        pages: [
            {
                name: lgls("explore.title"),
                icon: "explore",
                label: exploreOrganizationsRes.success ? Object.keys(exploreOrganizationsRes.msg).length : 0,

                content: [
                    {
                        type: "row",
                        gap: 10,
                        items: exploreItems
                    }
                ]
            },
            {
                name: lgls("membership.title"),
                icon: "group",
                label: Object.keys(userOrgs).length,

                content: [
                    {
                        type: "row",
                        gap: 10,
                        items: membershipItems
                    }
                ]
            },
            {
                name: "Dashboard",
                icon: "analytics",

                content: [
                    {
                        type: "row-clear",
                        gap: 10,
                        items: [
                            {
                                type: "placeholder",
                                title: "Dashboard",
                                description: "Select one of your organizations to view or edit its details"
                            },
                            {
                                type: "placeholder",
                                id: "dashboardOrgSelect"
                            },
                            {
                                type: "divider"
                            },
                            {
                                type: "placeholder",
                                title: "Members",
                                id: "dashboardOrgMembers",
                                description: "--",
                                classList: ["placeholder-bigdata"]
                            },
                            {
                                type: "placeholder",
                                title: "Invite code",
                                id: "dashboardOrgInviteCode",
                                description: "--",
                                note: "This code cannot be changed. You can share this code with trusted individuals so they can join the organization",
                                classList: ["placeholder-bigdata"]
                            },
                            {
                                type: "divider"
                            },
                            {
                                type: "placeholder",
                                title: "DANGER ZONE",
                                classList: ["text-danger"]
                            },
                            {
                                type: "container",
                                id: "dashboardOrgButtons",
                                disabled: true
                            },
                            {
                                type: "button",
                                class: "danger",
                                title: "Delete organization",
                                id: "dashboardOrgRemoveBtn",
                                container: "#dashboardOrgButtons"
                            }
                        ]
                    }
                ]
            },
            {
                name: lgls("createNew.title"),
                icon: "add",

                content: [
                    {
                        type: "row-clear",
                        gap: 10,
                        items: [
                            {
                                type: "placeholder",
                                title: lgls("createNew.header.title"),
                                description: lgls("createNew.header.description")
                            },
                            {
                                type: "input",
                                placeholder: lgls("createNew.inputs.name"),
                                id: "orgName"
                            },
                            {
                                type: "input",
                                placeholder: lgls("createNew.inputs.about"),
                                id: "orgDesc"
                            },
                            {
                                type: "input",
                                placeholder: lgls("createNew.inputs.website"),
                                id: "orgWebsite"
                            },
                            {
                                type: "placeholder",
                                title: lgls("createNew.preview.title"),
                                description: lgls("createNew.preview.description")
                            },
                            {   
                                id: "orgPreview",
                                type: "organization",
                                name: lgls("createNew.preview.emptyName"),
                                description: lgls("createNew.preview.emptyDescription"),
                                columns: [
                                    {
                                        name: lgls("membersLabel"),
                                        value: 1
                                    },
                                    {
                                        name: lgls("roleLabel"),
                                        value: lgls("ownerRoleLabel")
                                    }
                                ],
                                website: "https://example.com/",
                                badgeOwner: true
                            },
                            {
                                type: "container",
                                id: "buttonsContainer"
                            },
                            {
                                type: "button",
                                id: "orgConfirm",
                                title: lgls("buttons.create"),
                                container: "#buttonsContainer"
                            }
                        ]
                    }
                ]
            }
        ]
    })

    const element = orgModal.el
    const createOrgNameField = element.querySelector("#orgName")
    const createOrgDescField = element.querySelector("#orgDesc")
    const createOrgWebsiteField = element.querySelector("#orgWebsite")
    const createOrgSubmitBtn = element.querySelector("#orgConfirm")
    const modalPreview = element.querySelector(".modal-org#orgPreview")

    createOrgNameField.addEventListener("input", (e) => {
        modalPreview.querySelector(".modal-org__title p").textContent = e.target.value
        modalPreview.querySelector(".generated-avatar").textContent = getInitials(e.target.value)

        if(e.target.value.length == 0) {
            modalPreview.querySelector(".modal-org__title p").textContent = lgls("createNew.preview.emptyName")
            modalPreview.querySelector(".generated-avatar").textContent = getInitials("U")
        }
    })
    createOrgDescField.addEventListener("input", (e) => {
        modalPreview.querySelector(".modal-org-description").textContent = truncateString(e.target.value, 100)

        if(e.target.value.length == 0) {
            modalPreview.querySelector(".modal-org-description").textContent = lgls("createNew.preview.emptyDescription")
        }
    })
    createOrgWebsiteField.addEventListener("input", (e) => {
        modalPreview.querySelector(".modal-org-icontext a").textContent = e.target.value

        if(e.target.value.length == 0) {
            modalPreview.querySelector(".modal-org-icontext a").textContent = "example.com"
        }
    })

    createOrgSubmitBtn.addEventListener("click", async () => {
        const name = createOrgNameField.value
        const desc = createOrgDescField.value
        const website = createOrgWebsiteField.value

        const createOrgRes = await window.electron.createOrganization(
            {
                name: name,
                description: desc,
                website: website
            }
        )

        if(!createOrgRes.success) {
            createNotify(
                {
                    type: "danger",
                    icon: "close",
                    title: lgls("notifications.creatingError.title"),
                    content: createOrgRes.msg.message == undefined ? createOrgRes.msg : createOrgRes.msg.message
                }
            )
        }
        else {
            orgModal.close()

            element.addEventListener("transitionend", () => {
                sendEvent("org-created", {})
            })

            createNotify(
                {
                    type: "success",
                    icon: "check",
                    title: lgls("notifications.creatingSuccess.title"),
                    content: lgls("notifications.creatingSuccess.description", { name: createOrgRes.msg.name })
                }
            ) 
        }
    })

    // dashboard

    const dashboardOrgSelect = new Options("dashboardOrgSelect")
    dashboardOrgSelect.clear()
    dashboardOrgSelect.add("none", "None").default()

    Object.keys(userOrgs).forEach(index => {
        const org = userOrgs[index]
        const orgItemData = {}

        if(org.verified == 1) {
            orgItemData["badge"] = { color: "#3264a8", icon: "check" }
        }
        if(org.description) {
            orgItemData["secondary"] = truncateString(org.description, 50)
        }

        const item = dashboardOrgSelect.add(org.id, org.name, orgItemData)
    })

    dashboardOrgSelect.appendTo(element.querySelector("#dashboardOrgSelect"))

    const alreadyLoadedDashboardOrgs = new Map()

    const removeBtn = element.querySelector("#dashboardOrgRemoveBtn")
    const buttonsContainer = element.querySelector("#dashboardOrgButtons")
    const membersCount = element.querySelector("#dashboardOrgMembers .modal-category__item-desc")
    const inviteCode = element.querySelector("#dashboardOrgInviteCode .modal-category__item-desc")

    dashboardOrgSelect.on("click", async (e) => {
        function render(data) {
            buttonsContainer.classList.remove("disabled")
            membersCount.textContent = data.members_count
            inviteCode.textContent = data.invite_code

            removeBtn.onclick = async () => {
                orgModal.disableCurrent()

                const removeOrgRes = await window.electron.removeOrg(data.id)

                console.log(removeOrgRes.msg)

                if(removeOrgRes.success) {
                    sendEvent("org-removed", {})
                }
                else {
                    createNotify(
                        {
                            type: "danger",
                            icon: "close",
                            title: "Organization delete error",
                            content: String(removeOrgRes.msg)
                        }
                    )
                }

                orgModal.unDisableCurrent()
            }
        }

        if(!alreadyLoadedDashboardOrgs.has(e.id)) {
            const orgRes = await window.electron.getOrgDataFromAPI(e.id)

            if(orgRes.success) {
                const data = orgRes.msg
                render(data)
                alreadyLoadedDashboardOrgs.set(e.id, data)
            }
        }
        else {
            render(alreadyLoadedDashboardOrgs.get(e.id))
        }
    })

    // 

    return orgModal
}