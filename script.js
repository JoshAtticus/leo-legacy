// yes its a mess
// no i wont do anything about it
// - Eris

let end = false;
let page = "load";
const sidediv = document.querySelectorAll(".side");
sidediv.forEach(function (sidediv) {
    sidediv.classList.add("hidden");
});
let lul = 0;
let eul;
let sul = "";
let pre = "";

let ipBlocked = false;

const communityDiscordLink = "https://discord.com/invite/THgK9CgyYJ";
const forumLink = "https://forums.meower.org";
const server = "wss://server.meower.org/";

const pfpCache = {};
const postCache = {};  // {chatId: [post, post, ...]} (up to 25 posts for inactive chats)
const chatCache = {}; // {chatId: chat}

loadsavedplugins();
loadcstmcss();
loadcsttme();

function replsh(rpl) {
    const trimmedString = rpl.length > 25 ?
        rpl.substring(0, 22) + "..." :
        rpl;
    return trimmedString;
}
// make it so when reconnect happens it goes back to the prev screen and not the start page
function main() {
    meowerConnection = new WebSocket(server);
    let loggedin = false;

    meowerConnection.addEventListener('error', function (event) {
        //launch screen
    });

    meowerConnection.onclose = (event) => {
        logout(true);
    };
    page = "login";
    loadtheme();

    if ('windowControlsOverlay' in navigator) {
        console.log("PWA!!!!");
    }

    meowerConnection.onmessage = (event) => {
        console.log("INC: " + event.data);

        const sentdata = JSON.parse(event.data);
        let data
        if (sentdata.val == "I:112 | Trusted Access enabled") {
            data = {
                cmd: "direct",
                val: {
                    cmd: "type",
                    val: "js"
                }
            };

            meowerConnection.send(JSON.stringify(data));
            console.log("OUT: " + JSON.stringify(data));

            data = {
                cmd: "direct",
                val: "meower"
            };

            meowerConnection.send(JSON.stringify(data));
            console.log("OUT: " + JSON.stringify(data));
            if (localStorage.getItem("token") != undefined && localStorage.getItem("uname") != undefined) {
                login(localStorage.getItem("uname"), localStorage.getItem("token"));
            } else {
                const pageContainer = document.getElementById("main");
                pageContainer.innerHTML =
                    `<div class='settings'>
                    <div class='login'>
                        <h1>Login</h1>
                        <input type='text' id='userinput' placeholder='Username' class='login-input text' aria-label="username input">
                        <input type='password' id='passinput' placeholder='Password' class='login-input text' aria-label="password input">
                        <input type='button' id='login' value='Log in' class='login-input button' onclick='login(document.getElementById("userinput").value, document.getElementById("passinput").value)' aria-label="sign up">
                        <input type='button' id='signup' value='Sign up' class='login-input button' onclick='signup(document.getElementById("userinput").value, document.getElementById("passinput").value)' aria-label="log in">
                        <small>meo made by eri; leo made by JoshAtticus</small>
                        <div id='msgs'></div>
                        </div>
                        <div class='footer'>
                        <img src="/images/leo.png></img>
                    </div>
                </div>
                `;
            };
        } else if (sentdata.listener == "auth") {
            if (sentdata.val.mode && sentdata.val.mode == "auth") {
                loggedin = true;
                if (localStorage.getItem("token") == undefined || localStorage.getItem("uname") == undefined || localStorage.getItem("permissions") == undefined) {
                    localStorage.setItem("uname", sentdata.val.payload.username);
                    localStorage.setItem("token", sentdata.val.payload.token);
                    localStorage.setItem("permissions", sentdata.val.payload.account.permissions);
                }
                sidebars();

                // work on this
                if (pre !== "") {
                    if (pre === "home") {
                        loadhome();
                    } else if (pre === "explore") {
                        loadexplore();
                    } else if (pre === "start") {
                        loadstart();
                    } else if (pre === "settings") {
                        loadstgs();
                    } else {
                        loadchat(pre);
                    }
                } else if (!settingsstuff().homepage) {
                    loadstart();
                } else {
                    loadhome();
                }
                console.log("Logged in!");
            } else if (sentdata.cmd == "statuscode" && sentdata.val != "I:100 | OK") {
                if ("token" in localStorage)
                    logout(false);
                switch (sentdata.val) {
                    case "I:015 | Account exists":
                        openUpdate("Username Already Taken!");
                        break;
                    case "E:103 | ID not found":
                        openUpdate("Invalid Username!");
                        break;
                    case "I:011 | Invalid Password":
                        openUpdate("Invalid Password!");
                        break;
                    case "E:018 | Account Banned":
                        openUpdate("Account Banned!");
                        break;
                    case "E:025 | Deleted":
                        openUpdate("Account Deleted!");
                        break;
                    case "E:110 | ID conflict":
                        openUpdate("You probably logged in on another client. Refresh the page and log back in to continue.");
                        break;
                    default:
                        openUpdate(`Unknown Login Status: ${sentdata.val}`);
                        break;
                }
            }
        } else if (loggedin && sentdata.val.post_origin) {
            let postOrigin = sentdata.val.post_origin;
            if (postCache[postOrigin]) {
                postCache[postOrigin].push(sentdata.val);

                if (page === postOrigin) {
                    loadpost(sentdata.val);
                } else if (postCache[postOrigin].length >= 24) {
                    postCache[postOrigin].shift();
                }
            }
        } else if (end) {
            return 0;
        } else if (sentdata.val.mode == "update_profile") {
            let username = sentdata.val.payload._id;
            if (pfpCache[username]) {
                delete pfpCache[username];
                loadPfp(username, 0)
                    .then(pfpElement => {
                        if (pfpElement) {
                            pfpCache[username] = pfpElement.cloneNode(true);
                            for (const elem of document.getElementsByClassName("avatar")) {
                                if (elem.getAttribute("data-username") !== username) continue;
                                elem.replaceWith(pfpElement.cloneNode(true));
                            }
                        }
                    });
            }
        } else if (sentdata.val.mode == "update_post") {
            let postOrigin = sentdata.val.payload.post_origin;
            if (postCache[postOrigin]) {
                index = postCache[postOrigin].findIndex(post => post._id === sentdata.val.payload._id);
                if (index !== -1) {
                    postCache[postOrigin][index] = Object.assign(
                        postCache[postOrigin][index],
                        sentdata.val.payload
                    );
                }
            }
            if (document.getElementById(sentdata.val.payload.post_id)) {
                loadpost(sentdata.val.payload);
            }
        } else if (sentdata.val.mode == "create_chat") {
            const chat = sentdata.val.payload;
            chatCache[chat._id] = chat;

            const r = document.createElement("button");
            r.id = chat._id;
            r.className = `navigation-button button gcbtn`;
            r.onclick = function () {
                loadchat(chat._id);
            };
            if (chat.type === 1) {
                console.log(loadPfp(chat.members.find(v => v !== localStorage.getItem("uname"))).src);
            }

            const chatIconElem = document.createElement("img");
            chatIconElem.classList.add("avatar-small");
            if (chat.type === 0) {
                chatIconElem.src = "images/GC.svg";
            } else {
                loadPfp(chat.members.find(v => v !== localStorage.getItem("uname")))
                    .then(pfpElem => {
                        chatIconElem.src = pfpElem.src;
                    });
            }
            r.appendChild(chatIconElem);

            const chatNameElem = document.createElement("span");
            chatNameElem.classList.add("gcname");
            chatNameElem.innerText = chat.nickname || `@${chat.members.find(v => v !== localStorage.getItem("uname"))}`;
            r.appendChild(chatNameElem);

            const gcs = document.getElementsByClassName("gcs");
            if (gcs.length > 0) {
                gcs[0].appendChild(r);
            }
        } else if (sentdata.val.mode == "update_chat") {
            const chatId = sentdata.val.payload._id;

            if (chatId in chatCache) {
                chatCache[chatId] = Object.assign(
                    chatCache[chatId],
                    sentdata.val.payload
                );
            }

            if (sentdata.val.payload.nickname) {
                const newNickname = sentdata.val.payload.nickname;
                document.getElementById(chatId).innerText = newNickname;
                if (page === sentdata.val.payload._id) {
                    const nicknameElem = document.getElementById("nickname");
                    const chatIdElem = nicknameElem.childNodes[1].cloneNode(true);
                    nicknameElem.innerText = newNickname;
                    nicknameElem.appendChild(chatIdElem);
                }
            }
        } else if (sentdata.cmd == "ulist") {
            const iul = sentdata.val;
            sul = iul.trim().split(";");
            eul = sul;
            lul = sul.length - 1;

            if (sul.length > 1) {
                sul = sul.slice(0, -2).join(", ") + (sul.length > 2 ? ", " : "") + sul.slice(-2).join(".");
            } else {
                sul = sul[0];
            }

            if (page == "home") {
                document.getElementById("info").innerText = lul + " users online (" + sul + ")";
            }
        } else if (sentdata.val.mode == "delete") {
            console.log("Received delete command for ID:", sentdata.val.id);

            if (chatCache[sentdata.val.id]) {
                delete chatCache[sentdata.val.id];
            }
            if (postCache[sentdata.val.id]) {
                delete postCache[sentdata.val.id];
            }
            for (const key in postCache) {
                const index = postCache[key].findIndex(post => post._id === sentdata.val.id);
                if (index !== -1) {
                    postCache[key].splice(index, 1);
                    break;
                }
            }

            const divToDelete = document.getElementById(sentdata.val.id);
            if (divToDelete) {
                divToDelete.parentNode.removeChild(divToDelete);
                if (page === sentdata.val.id) {
                    openUpdate("You have been removed from the chat you were in.");
                    if (!settingsstuff().homepage) {
                        loadstart();
                    } else {
                        loadhome();
                    }
                }
                console.log(sentdata.val.id, "deleted successfully.");
            } else {
                console.warn(sentdata.val.id, "not found.");
            }
        }
    };
    document.addEventListener("keydown", function (event) {
        if (page !== "settings" && page !== "explore" && page !== "login" && page !== "start") {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (document.getElementById('msg') === document.activeElement) {
                    event.preventDefault();
                    sendpost();
                    const textarea = document.getElementById('msg');
                    textarea.style.height = 'auto';
                } else {
                    if (opened === 1) {
                        fstemj();
                        document.getElementById("msg").focus();
                    }
                }
            } else if (event.key === "Enter" && event.shiftKey) {
            } else if (event.key === "Escape") {
                closemodal();
                closeImage();
                if (opened === 1) {
                    closepicker();
                }
                const editIndicator = document.getElementById("edit-indicator");
                if (editIndicator.hasAttribute("data-postid")) {
                    editIndicator.removeAttribute("data-postid");
                    editIndicator.innerText = "";
                    document.getElementById('msg').value = "";
                    autoresize();
                }
                document.getElementById("msg").blur();
            }
        }
    });
    addEventListener("keydown", (event) => {
        if (!event.ctrlKey && event.keyCode >= 48 && event.keyCode <= 90) {
            if (!document.activeElement || (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
                document.getElementById("msg").focus();
            }
        } else if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            if (page !== "settings" && page !== "explore" && page !== "login" && page !== "start") {
                event.preventDefault();
                togglePicker();
            }
        } else if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
            if (postCache[page]) {
                event.preventDefault();

                const post = [...postCache[page]].reverse().find(post => post.u === localStorage.getItem("uname"));
                if (post) {
                    editPost(page, post._id);
                }
            }
        } else if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
            if (!document.activeElement || (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA')) {
                document.getElementById("msg").focus();
            }
        }
    });
}

function loadpost(p) {
    let user
    let content
    if (p.u == "Discord" || p.u == "SplashBridge") {
        const rcon = settingsstuff().swearfilter && p.unfiltered_p ? p.unfiltered_p : p.p;
        const parts = rcon.split(': ');
        user = parts[0];
        content = parts.slice(1).join(': ');
    } else {
        content = settingsstuff().swearfilter && p.unfiltered_p ? p.unfiltered_p : p.p;
        user = p.u;
    }

    const postContainer = document.createElement("div");
    postContainer.classList.add("post");
    postContainer.setAttribute("tabindex", "0");

    const wrapperDiv = document.createElement("div");
    wrapperDiv.classList.add("wrapper");

    const pfpDiv = document.createElement("div");
    pfpDiv.classList.add("pfp");

    wrapperDiv.appendChild(createButtonContainer(p));

    const mobileButtonContainer = document.createElement("div");
    mobileButtonContainer.classList.add("mobileContainer");
    mobileButtonContainer.innerHTML = `
    <div class='toolbarContainer'>
        <div class='toolButton mobileButton' onclick='openModal("${p._id}");'>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M4 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" clip-rule="evenodd" class=""></path></svg>
        </div>
    </div>
    `;

    wrapperDiv.appendChild(mobileButtonContainer);

    const pstdte = document.createElement("i");
    pstdte.classList.add("date");
    tsr = p.t.e;
    tsra = tsr * 1000;
    tsrb = Math.trunc(tsra);
    const ts = new Date();
    ts.setTime(tsrb);
    pstdte.innerText = new Date(tsrb).toLocaleString([], { month: '2-digit', day: '2-digit', year: '2-digit', hour: 'numeric', minute: 'numeric' });

    const pstinf = document.createElement("h3");
    pstinf.innerHTML = `<span id='username' onclick='openUsrModal("${user}")'>${user}</span>`;

    if (p.u == "Discord" || p.u == "SplashBridge") {
        const bridged = document.createElement("bridge");
        bridged.innerText = "Bridged";
        bridged.setAttribute("title", "This post has been bridged from another platform.");
        pstinf.appendChild(bridged);
    }

    pstinf.appendChild(pstdte);
    wrapperDiv.appendChild(pstinf);

    const replyregex = /@(\w+)\s+"([^"]*)"\s+\(([^)]+)\)/g;
    let match = replyregex.exec(content);
    if (match) {
        const replyid = match[3];
        const pageContainer = document.getElementById("msgs");

        if (pageContainer.firstChild) {
            pageContainer.insertBefore(postContainer, pageContainer.firstChild);
        } else {
            pageContainer.appendChild(postContainer);
        }

        loadreply(p.post_origin, replyid).then(replycontainer => {
            pstinf.after(replycontainer);
            //wrapperDiv.appendChild(replycontainer);
        });

        content = content.replace(match[0], '').trim();
    }
    let postContentText = document.createElement("p");
    postContentText.className = "post-content";
    // tysm tni <3
    if (typeof md !== 'undefined') {
        md.disable(['image']);
        postContentText.innerHTML = erimd(md.render(content));
        postContentText.innerHTML = buttonbadges(postContentText);
    } else {
        // fallback for when md doenst work
        // figure this issue OUT
        postContentText.innerHTML = oldMarkdown(content);
        console.error("Parsed with old markdown, fix later :)")
    }
    const emojiRgx = /^(?:\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])+$/gi;
    const discordRgx = /^<(a)?:\w+:\d+>$/gi;
    if (emojiRgx.test(content) || discordRgx.test(content)) {
        postContentText.classList.add('big');
    }

    if (content) {
        wrapperDiv.appendChild(postContentText);
    }

    const links = content.match(/(?:https?|ftp):\/\/[^\s(){}[\]]+/g);
    const embd = embed(links);
    if (embd) {
        embd.forEach(embeddedElement => {
            wrapperDiv.appendChild(embeddedElement);
        });
    }

    postContainer.appendChild(wrapperDiv);

    loadPfp(user, 0)
        .then(pfpElement => {
            if (pfpElement) {
                pfpDiv.appendChild(pfpElement);
                //thx stackoverflow
                pfpCache[user] = pfpElement.cloneNode(true);
                postContainer.insertBefore(pfpDiv, wrapperDiv);
            }
        });

    const pageContainer = document.getElementById("msgs");
    const existingPost = document.getElementById(p._id);
    postContainer.id = p._id;
    if (existingPost) {
        existingPost.replaceWith(postContainer);
    } else if (pageContainer.firstChild) {
        pageContainer.insertBefore(postContainer, pageContainer.firstChild);
    } else {
        pageContainer.appendChild(postContainer);
    }
}

function loadPfp(username, button) {
    return new Promise((resolve, reject) => {
        if (pfpCache[username]) {
            resolve(pfpCache[username].cloneNode(true));
        } else {
            let pfpElement;

            fetch(`https://api.meower.org/users/${username}`)
                .then(userResp => userResp.json())
                .then(userData => {
                    if (userData.avatar) {
                        const pfpurl = `https://uploads.meower.org/icons/${userData.avatar}`;


                        pfpElement = document.createElement("img");
                        pfpElement.setAttribute("src", pfpurl);
                        pfpElement.setAttribute("alt", username);
                        pfpElement.setAttribute("data-username", username);
                        pfpElement.classList.add("avatar");
                        if (!button) {
                            pfpElement.setAttribute("onclick", `openUsrModal('${username}')`);
                        }

                        if (userData.avatar_color) {
                            //                            if (userData.avatar_color === "!color") {
                            //                                pfpElement.style.border = `3px solid #f00`;
                            //                                pfpElement.style.backgroundColor = `#f00`;
                            //                            } else {
                            //                            }
                            pfpElement.style.border = `3px solid #${userData.avatar_color}`;
                            pfpElement.style.backgroundColor = `#${userData.avatar_color}`;
                        }

                        pfpElement.addEventListener('error', () => {
                            pfpElement.setAttribute("src", `${pfpurl}.png`);
                            pfpCache[username].setAttribute("src", `${pfpurl}.png`);
                        });

                    } else if (userData.pfp_data) {
                        let pfpurl;
                        if (userData.pfp_data > 0 && userData.pfp_data <= 37) {
                            pfpurl = `images/avatars/icon_${userData.pfp_data - 1}.svg`;
                        } else {
                            pfpurl = `images/avatars/icon_err.svg`;
                        }

                        pfpElement = document.createElement("img");
                        pfpElement.setAttribute("src", pfpurl);
                        pfpElement.setAttribute("alt", username);
                        pfpElement.setAttribute("data-username", username);
                        pfpElement.classList.add("avatar");
                        if (!button) {
                            pfpElement.setAttribute("onclick", `openUsrModal('${username}')`);
                        }
                        pfpElement.classList.add("svg-avatar");

                        if (userData.avatar_color) {
                            pfpElement.style.border = `3px solid #${userData.avatar_color}`;
                        }

                    } else {
                        const pfpurl = `images/avatars/icon_-4.svg`;

                        pfpElement = document.createElement("img");
                        pfpElement.setAttribute("src", pfpurl);
                        pfpElement.setAttribute("alt", username);
                        pfpElement.setAttribute("data-username", username);
                        if (!button) {
                            pfpElement.setAttribute("onclick", `openUsrModal('${username}')`);
                        }
                        pfpElement.classList.add("avatar");
                        pfpElement.classList.add("svg-avatar");

                        pfpElement.style.border = `3px solid #fff`;
                        pfpElement.style.backgroundColor = `#fff`;
                    }

                    if (pfpElement) {
                        pfpCache[username] = pfpElement.cloneNode(true);
                    }

                    resolve(pfpElement);
                })
                .catch(error => {
                    console.error("Failed to fetch:", error);
                    resolve(null);
                });
        }
    });
}

function loadPfpstraight(username, button) {
    return new Promise((resolve, reject) => {
        let pfpElement;

        fetch(`https://api.meower.org/users/${username}`)
            .then(userResp => userResp.json())
            .then(userData => {
                if (userData.avatar) {
                    const pfpurl = `https://uploads.meower.org/icons/${userData.avatar}`;

                    pfpElement = document.createElement("img");
                    pfpElement.setAttribute("src", pfpurl);
                    pfpElement.setAttribute("alt", username);
                    pfpElement.setAttribute("data-username", username);
                    pfpElement.classList.add("avatar-small");
                    if (!button) {
                        pfpElement.setAttribute("onclick", `openUsrModal('${username}')`);
                    }

                    if (userData.avatar_color) {
                        pfpElement.style.border = `3px solid #${userData.avatar_color}`;
                        pfpElement.style.backgroundColor = `#${userData.avatar_color}`;
                    }

                    pfpElement.addEventListener('error', () => {
                        pfpElement.setAttribute("src", `${pfpurl}.png`);
                    });

                } else if (userData.pfp_data) {
                    let pfpurl;
                    if (userData.pfp_data > 0 && userData.pfp_data <= 37) {
                        pfpurl = `images/avatars/icon_${userData.pfp_data - 1}.svg`;
                    } else {
                        pfpurl = `images/avatars/icon_err.svg`;
                    }

                    pfpElement = document.createElement("img");
                    pfpElement.setAttribute("src", pfpurl);
                    pfpElement.setAttribute("alt", username);
                    pfpElement.setAttribute("data-username", username);
                    pfpElement.classList.add("avatar-small");
                    if (!button) {
                        pfpElement.setAttribute("onclick", `openUsrModal('${username}')`);
                    }
                    pfpElement.classList.add("svg-avatar");

                    if (userData.avatar_color) {
                        if (userData.avatar_color === "!color") {
                            pfpElement.style.border = `3px solid #f00`;
                            pfpElement.style.backgroundColor = `#f00`;
                        } else {
                            pfpElement.style.border = `3px solid #${userData.avatar_color}`;
                            pfpElement.style.backgroundColor = `#${userData.avatar_color}`;
                        }
                    }

                } else {
                    const pfpurl = `images/avatars/icon_-4.svg`;

                    pfpElement = document.createElement("img");
                    pfpElement.setAttribute("src", pfpurl);
                    pfpElement.setAttribute("alt", username);
                    pfpElement.setAttribute("data-username", username);
                    if (!button) {
                        pfpElement.setAttribute("onclick", `openUsrModal('${username}')`);
                    }
                    pfpElement.classList.add("avatar");
                    pfpElement.classList.add("svg-avatar");

                    pfpElement.style.border = `3px solid #fff`;
                    pfpElement.style.backgroundColor = `#fff`;

                    console.error("No avatar or pfp_data available for: ", username);
                    resolve(null);
                }

                resolve(pfpElement);
            })
            .catch(error => {
                console.error("Failed to fetch:", error);
                resolve(null);
            });
    });
}

async function loadreply(postOrigin, replyid) {
    const replyregex = /^@[^ ]+ (.+?) \(([^)]+)\)/;
    try {
        let replydata = postCache[postOrigin].find(post => post._id === replyid);
        if (!replydata) {
            const replyresp = await fetch(`https://api.meower.org/posts?id=${replyid}`, {
                headers: { token: localStorage.getItem("token") }
            });
            replydata = await replyresp.json();
        }

        const replycontainer = document.createElement("div");
        replycontainer.classList.add("reply");
        let replyContent = replydata.p;

        const match = replydata.p.replace(replyregex, "").trim();
        if (match) {
            replyContent = match;
        }

        if (replydata.u === "Discord" || replydata.u === "SplashBridge") {
            const rcon = replyContent;
            const parts = rcon.split(': ');
            const user = parts[0];
            const content = parts.slice(1).join(': ');
            replycontainer.innerHTML = `<p style='font-weight:bold;margin: 10px 0 10px 0;'>${escapeHTML(user)}</p><p style='margin: 10px 0 10px 0;'>${escapeHTML(content)}</p>`;
        } else {
            replycontainer.innerHTML = `<p style='font-weight:bold;margin: 10px 0 10px 0;'>${escapeHTML(replydata.u)}</p><p style='margin: 10px 0 10px 0;'>${escapeHTML(replyContent)}</p>`;
        }

        return replycontainer;
    } catch (error) {
        console.error("Error fetching reply:", error);
        return document.createElement("p");
    }
}

function reply(event) {
    const postContainer = event.target.closest('.post');
    if (postContainer) {
        const username = postContainer.querySelector('#username').innerText;
        const postcont = postContainer.querySelector('p').innerText
            .replace(/\n/g, ' ')
            .replace(/@\w+/g, '')
            .split(' ')
            .slice(0, 6)
            .join(' ');
        const ogmsg = document.getElementById('msg').value

        const postId = postContainer.id;
        document.getElementById('msg').value = `@${username} "${postcont}..." (${postId})\n${ogmsg}`;
        document.getElementById('msg').focus();
        autoresize();
    }
}

function pingusr(event) {
    const postContainer = event.target.closest('.post');
    if (postContainer) {
        const username = postContainer.querySelector('#username').innerText;

        document.getElementById('msg').value = `@${username} `;
        document.getElementById('msg').focus();
        autoresize();
    }
}

function loadtheme() {
    const theme = localStorage.getItem("theme");

    if (theme) {
        document.documentElement.classList.add(theme + "-theme");
    }

    const rootStyles = window.getComputedStyle(document.documentElement);
    const rootBackgroundColor = rootStyles.getPropertyValue('--background');

    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
        metaThemeColor.setAttribute("content", rootBackgroundColor);
    }
}

function sharepost() {
    const postId = event.target.closest('.post').id;
    window.open(`https://leo.atticat.tech/share?id=${postId}`, '_blank');
}

function login(user, pass) {
    const data = {
        cmd: "direct",
        val: {
            cmd: "authpswd",
            val: {
                username: user,
                pswd: pass
            }
        },
        listener: "auth"
    };
    meowerConnection.send(JSON.stringify(data));
    console.log(user);
    console.log("User is logging in, details will not be logged for security reasons.");
}

function signup(user, pass) {
    const data = {
        cmd: "direct",
        val: {
            cmd: "gen_account",
            val: {
                username: user,
                pswd: pass
            }
        },
        listener: "auth"
    };
    meowerConnection.send(JSON.stringify(data));
    console.log("User is signing up, details will not be logged for security reasons.");
}

function sendpost() {
    const message = document.getElementById('msg').value;

    if (!message.trim()) {
        console.log("The message is blank.");
        return;
    }

    const editIndicator = document.getElementById("edit-indicator");
    if (editIndicator.hasAttribute("data-postid")) {
        fetch(`https://api.meower.org/posts?id=${editIndicator.getAttribute("data-postid")}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                token: localStorage.getItem("token")
            },
            body: JSON.stringify({ content: message })
        });
        editIndicator.removeAttribute("data-postid");
        editIndicator.innerText = "";
    } else {
        fetch(`https://api.meower.org/${page === "home" ? "home" : `posts/${page}`}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                token: localStorage.getItem("token")
            },
            body: JSON.stringify({ content: message })
        });
    }

    document.getElementById('msg').value = "";
    autoresize();
    closepicker();
}

function newpost(content) {
    const message = content

    if (!message.trim()) {
        console.log("The message is blank.");
        return;
    }

    const editIndicator = document.getElementById("edit-indicator");
    if (editIndicator.hasAttribute("data-postid")) {
        fetch(`https://api.meower.org/posts?id=${editIndicator.getAttribute("data-postid")}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                token: localStorage.getItem("token")
            },
            body: JSON.stringify({ content: message })
        });
        editIndicator.removeAttribute("data-postid");
        editIndicator.innerText = "";
    } else {
        fetch(`https://api.meower.org/${page === "home" ? "home" : `posts/${page}`}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                token: localStorage.getItem("token")
            },
            body: JSON.stringify({ content: message })
        });
    }

    document.getElementById('msg').value = "";
    autoresize();
    closepicker();
}

function loadhome() {
    page = "home";
    pre = "home";
    let pageContainer
    pageContainer = document.getElementById("main");
    pageContainer.innerHTML = `
        <div class='info'><h1 class='header-top'>Home</h1><p id='info'></p>
        </div>` + loadinputs();
    document.getElementById("info").innerText = lul + " users online (" + sul + ")";

    sidebars();

    if (postCache["home"]) {
        postCache["home"].forEach(post => {
            if (page !== "home") {
                return;
            }
            loadpost(post);
        });
    } else {
        const xhttpPosts = new XMLHttpRequest();
        xhttpPosts.open("GET", "https://api.meower.org/home?autoget");
        xhttpPosts.onload = () => {
            const postsData = JSON.parse(xhttpPosts.response);
            const postsarray = postsData.autoget || [];

            postsarray.reverse();
            postCache["home"] = postsarray;
            postsarray.forEach(post => {
                if (page !== "home") {
                    return;
                }
                loadpost(post);
            });
        };
        xhttpPosts.send();
    }
}

function sidebars() {
    let pageContainer
    pageContainer = document.getElementById("nav");
    pageContainer.innerHTML = `
    <div class='navigation'>
    <div class='nav-top'>
    <button class='trans' id='submit' value='Home' onclick='loadstart()' aria-label="Home">
        <svg width="32" height="32" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
            <g>
                <path fill="currentColor" d="M468.42 20.5746L332.997 65.8367C310.218 58.8105 284.517 55.049 255.499 55.6094C226.484 55.049 200.78 58.8105 178.004 65.8367L42.5803 20.5746C18.9102 16.3251 -1.81518 36.2937 2.5967 59.1025L38.7636 200.894C18.861 248.282 12.1849 296.099 12.1849 325.027C12.1849 399.343 44.6613 492 255.499 492C466.339 492 498.815 399.343 498.815 325.027C498.815 296.099 492.139 248.282 472.237 200.894L508.404 59.1025C512.814 36.2937 492.09 16.3251 468.42 20.5746Z"/>
            </g>
        </svg>
    </button>
    </div>
    </div>
    `;

    let navlist = `
    <input type='button' class='navigation-button button' id='explore' value='Explore' onclick='loadexplore();' aria-label="explore">
    <input type='button' class='navigation-button button' id='inbox' value='Inbox' onclick='loadinbox()' aria-label="inbox">
    <input type='button' class='navigation-button button' id='settings' value='Settings' onclick='loadstgs()' aria-label="settings">
    <button type='button' class='user-area button' id='profile' onclick='openUsrModal("${localStorage.getItem("uname")}")' aria-label="profile">
        <img class="avatar-small" id="uav" src="https://uploads.meower.org/icons/09M4f10bxn4AbvadnNCKZCiP" style="border: 3px solid #b190fe;">
        <span class="gcname">${localStorage.getItem("uname")}</span></div>
    </button>
    `;

    loadPfp(localStorage.getItem("uname"))
        .then(pfpElem => {
            if (pfpElem) {
                const userAvatar = document.getElementById("uav");
                userAvatar.src = pfpElem.src;
                userAvatar.style.border = pfpElem.style.border.replace("3px", "3px");
                if (pfpElem.classList.contains("svg-avatar")) {
                    userAvatar.classList.add("svg-avatar");
                }
            }
        });

    if (localStorage.getItem("permissions") === "1") {
        navlist = `<input type='button' class='navigation-button button' id='moderation' value='Moderate' onclick='openModModal()' aria-label="moderate">` + navlist;
    }

    let mdmdl = document.getElementsByClassName('navigation')[0];
    mdmdl.innerHTML += navlist;

    const char = new XMLHttpRequest();
    char.open("GET", "https://api.meower.org/chats?autoget");
    char.setRequestHeader("token", localStorage.getItem('token'));
    char.onload = async () => {
        const response = JSON.parse(char.response);
        console.log(char.response);

        const groupsdiv = document.getElementById("groups");
        const gcdiv = document.createElement("div");
        gcdiv.className = "gcs";
        gcdiv.setAttribute("tabindex", "-1");


        groupsdiv.innerHTML = `
        <h1 class="groupheader">Chats</h1>
        <button class="search-input button" id="search" aria-label="search" onclick="goAnywhere();"><span class="srchtx">Search</span></button
        
        `;
        gcdiv.innerHTML += `<button class="navigation-button button gcbtn" onclick="loadhome()">
        <svg width="36" height="26" class="homebuttonsvg" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.8334 21.6667V15.1667H15.1667V21.6667H20.5834V13H23.8334L13.0001 3.25L2.16675 13H5.41674V21.6667H10.8334Z" fill="currentColor"/></svg>
        <span class="gcname">Home</span></button>
        `;

        response.autoget.forEach(chat => {
            chatCache[chat._id] = chat;

            const r = document.createElement("button");
            r.id = chat._id;
            r.className = `navigation-button button gcbtn`;
            r.onclick = function () {
                loadchat(chat._id);
            };
            if (chat.type === 1) {
                console.log(loadPfp(chat.members.find(v => v !== localStorage.getItem("uname"))).src);
            }

            const chatIconElem = document.createElement("img");
            chatIconElem.classList.add("avatar-small");
            if (chat.type === 0) {
                chatIconElem.src = "images/GC.svg";
                chatIconElem.style.border = "3px solid #1f5831";
            } else {
                // this is so hacky :p
                // - Tnix
                loadPfp(chat.members.find(v => v !== localStorage.getItem("uname")))
                    .then(pfpElem => {
                        if (pfpElem) {
                            chatIconElem.src = pfpElem.src;
                            chatIconElem.style.border = pfpElem.style.border.replace("3px", "3px");
                            if (pfpElem.classList.contains("svg-avatar")) {
                                chatIconElem.classList.add("svg-avatar");
                            }
                        }
                        console.log(pfpElem);
                    });
            }
            console.log(chatIconElem)

            r.appendChild(chatIconElem);

            const chatNameElem = document.createElement("span");
            chatNameElem.classList.add("gcname");
            chatNameElem.innerText = chat.nickname || `@${chat.members.find(v => v !== localStorage.getItem("uname"))}`;
            r.appendChild(chatNameElem);

            gcdiv.appendChild(r);
        });

        groupsdiv.appendChild(gcdiv);

    };
    char.send();

    const sidediv = document.querySelectorAll(".side");
    sidediv.forEach(function (sidediv) {
        sidediv.classList.remove("hidden");
    });
}

function loadstart() {
    page = "start";
    pre = "start";
    sidebars();
    pageContainer = document.getElementById("main");
    pageContainer.innerHTML = `
    <div class="info"><h1>Start</h1></div>
    <div class="explore">
        <h3>Online - ${lul}</h3>
        <div class="start-users-online">
        
        </div>
        <div class="quick-btns">
        <div class="qc-bts-sc">
        <button class="qbtn button" aria-label="create chat" onclick="createChatModal()">Create Chat</button>
        <button class="qbtn button" aria-label="create chat" onclick="loadhome();">Go Home</button>
        </div>
        <div class="qc-bts-sc">
        <button class="qbtn button" aria-label="create chat" onclick="loadexplore();">Explore</button>
        <button class="qbtn button" aria-label="create chat" onclick="opendm('JoshAtticus')">DM Me :)</button>
        </div>
    </div>
    `;
    fetch('https://api.meower.org/ulist?autoget')
        .then(response => response.json())
        .then(data => {
            data.autoget.forEach(item => {
                const gr = item._id.trim();
                if (gr !== localStorage.getItem("uname")) {
                    const profilecont = document.createElement('div');
                    profilecont.classList.add('mdl-sec');
                    if (item.avatar_color !== "!color" && data.avatar_color) {
                        profilecont.classList.add('custom-bg');
                    }
                    if (item.avatar) {
                        profilecont.innerHTML = `
                        <img class="avatar-small" style="border: 3px solid #${item.avatar_color}; background-color:#${item.avatar_color};" src="https://uploads.meower.org/icons/${item.avatar}" alt="${item._id}" title="${item._id}"></img>
                    `;
                    } else if (item.pfp_data) {
                        profilecont.innerHTML = `
                        <img class="avatar-small svg-avatar" style="border: 3px solid #${item.avatar_color}"; src="images/avatars/icon_${item.pfp_data - 1}.svg" alt="${item._id}" title="${item._id}"></img>
                    `;
                    } else {
                        profilecont.innerHTML = `
                        <img class="avatar-small svg-avatar" style="border: 3px solid #000"; src="images/avatars/icon_-4.svg" alt="${item._id}" title="${item._id}"></img>
                    `;
                    }
                    const pl = `<button class="ubtn button" aria-label="${gr}"><div class="ubtnsa" onclick="openUsrModal('${gr}')">${profilecont.outerHTML}${gr}</div><div class="ubtnsb" onclick="opendm('${gr}')" id="username"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M12 22a10 10 0 1 0-8.45-4.64c.13.19.11.44-.04.61l-2.06 2.37A1 1 0 0 0 2.2 22H12Z" class=""></path></svg></div></button>`;
                    document.querySelector(".start-users-online").innerHTML += pl;
                }
            });
        });

}

function opendm(username) {
    fetch(`https://api.meower.org/users/${username}/dm`, {
        method: 'GET',
        headers: {
            'token': localStorage.getItem("token")
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            chatCache[data._id] = data;
            parent.loadchat(data._id);
            parent.closemodal();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function loadchat(chatId) {
    page = chatId;
    pre = chatId;

    if (!chatCache[chatId]) {
        fetch(`https://api.meower.org/chats/${chatId}`, {
            headers: { token: localStorage.getItem("token") }
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error("Chat not found");
                    } else {
                        throw new Error('Network response was not ok');
                    }
                }
                return response.json();
            })
            .then(data => {
                chatCache[chatId] = data;
                loadchat(chatId);
            })
            .catch(e => {
                openUpdate(`Unable to open chat: ${e}`);
                if (!settingsstuff().homepage) {
                    loadstart();
                } else {
                    loadhome();
                }
            });
        return;
    }

    sidebars();

    const data = chatCache[chatId];

    const mainContainer = document.getElementById("main");
    if (data.nickname) {
        mainContainer.innerHTML = `<div class='info'><h1 id='nickname'>${escapeHTML(data.nickname)}<i class="subtitle">${chatId}</i></h1><p id='info'></p></div>` + loadinputs();
        const ulinf = document.getElementById('info');
        data.members.forEach((user, index) => {
            if (index === data.members.length - 1) {
                ulinf.innerHTML += `<div class='ulmember'><span id='ulmnl'>${user}</span></div>`;
            } else {
                ulinf.innerHTML += `<div class='ulmember'><span id='ulmnl'>${user}</span>, </div>`;
            }
        });
        ulinf.innerHTML += `
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.00027 0C6.38172 0 5.88027 0.501441 5.88027 1.12V5.88013H1.12C0.501441 5.88013 0 6.38158 0 7.00013C0 7.61869 0.501441 8.12013 1.12 8.12013H5.88027V12.88C5.88027 13.4986 6.38171 14 7.00027 14C7.61883 14 8.12027 13.4986 8.12027 12.88V8.12013H12.88C13.4986 8.12014 14 7.61869 14 7.00013C14 6.38157 13.4986 5.88013 12.88 5.88013H8.12027V1.12C8.12027 0.501441 7.61883 0 7.00027 0Z" fill="currentColor"/>
        </svg>            
        `;
    } else {
        mainContainer.innerHTML = `<div class='info'><h1 id='nickname'>${data.members.find(v => v !== localStorage.getItem("uname"))}<i class="subtitle">${chatId}</i></h1><p id='info'></p></div>` + loadinputs();
    }

    if (postCache[chatId]) {
        postCache[chatId].forEach(post => {
            if (page !== chatId) {
                return;
            }
            loadpost(post);
        });
    } else {
        const xhttpPosts = new XMLHttpRequest();
        xhttpPosts.open("GET", `https://api.meower.org/posts/${chatId}?autoget`);
        xhttpPosts.setRequestHeader("token", localStorage.getItem('token'));
        xhttpPosts.onload = () => {
            const postsData = JSON.parse(xhttpPosts.response);
            const postsarray = postsData.autoget || [];

            postsarray.reverse();
            postCache[chatId] = postsarray;
            postsarray.forEach(post => {
                if (page !== chatId) {
                    return;
                }
                loadpost(post);
            });
        };
        xhttpPosts.send();
    }
}

function loadinbox() {
    page = "inbox"
    pre = "inbox"
    const inboxUrl = 'https://api.meower.org/inbox?autoget=1';

    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", inboxUrl);
    xhttp.setRequestHeader("token", localStorage.getItem('token'));
    xhttp.onload = () => {
        const mainContainer = document.getElementById("main");
        mainContainer.innerHTML = `
            <div class='info'>
                <h1>Inbox</h1>
                <p id='info'>Notifications are displayed here</p>
            </div>
            <div class='message-container'>
            </div>
            <div id='msgs' class='posts'></div>
        `;

        const sidedivs = document.querySelectorAll(".side");
        sidedivs.forEach(sidediv => sidediv.classList.remove("hidden"));

        const xhttpPosts = new XMLHttpRequest();
        xhttpPosts.open("GET", inboxUrl);
        xhttpPosts.setRequestHeader("token", localStorage.getItem('token'));
        xhttpPosts.onload = () => {
            const postsData = JSON.parse(xhttpPosts.response);
            const postsarray = postsData.autoget || [];

            postsarray.reverse();

            postsarray.forEach(postId => {
                loadpost(postId);
            });
        };
        xhttpPosts.send();
    };
    xhttp.send();
}

function logout(iskl) {
    if (!iskl) {
        localStorage.clear();
        meowerConnection.close();
    }
    end = true;
    for (const key in pfpCache) delete pfpCache[key];
    for (const key in postCache) delete postCache[key];
    for (const key in chatCache) delete chatCache[key];
    if (document.getElementById("msgs"))
        document.getElementById("msgs").innerHTML = "";
    if (document.getElementById("nav"))
        document.getElementById("nav").innerHTML = "";
    if (document.getElementById("groups"))
        document.getElementById("groups").innerHTML = "";
    end = false;
    main();
}

function loadstgs() {
    page = "settings";
    pre = "settings";
    const navc = document.querySelector(".nav-top");
    navc.innerHTML = `
    <input type='button' class='navigation-button button' id='submit' value='General' onclick='loadgeneral()' aria-label="general">
    <input type='button' class='navigation-button button' id='submit' value='Appearance' onclick='loadappearance()' aria-label="appearance">
    <input type="button" class="navigation-button button" id="submit" value="Plugins (Beta)" onclick="loadplugins()" aria-label="plugins">
    <input type='button' class='navigation-button button' id='logout' value='Logout' onclick='logout(false)' aria-label="logout">
    `;
    loadgeneral();
}

function loadgeneral() {
    const pageContainer = document.getElementById("main");
    const settingsContent = `
        <div class="settings">
            <h1>General</h1>
            <h3>Chat</h3>
            <div class="msgs"></div>
            <div class="stg-section">
            <label>
            Auto-navigate to Home
            <input type="checkbox" id="homepage" class="settingstoggle">
            <p class="subsubheader">Instead of showing you the Start Page you get directly taken to home</p>
            </label>
            </div>
            <div class="stg-section">
            <label>
            Disable console warning
            <input type="checkbox" id="consolewarnings" class="settingstoggle">
            <p class="subsubheader">Hides warning message from console</p>
            </label>
            </div>
            <h3>About</h3>
            <div class="stg-section">
            <span>leo v1.20</span>
            </div>
            </div>
            `;

    pageContainer.innerHTML = settingsContent;

    const chbxs = document.querySelectorAll("input[type='checkbox']");
    const homepagecheckbox = document.getElementById("homepage");
    const consolewarningscheckbox = document.getElementById("consolewarnings");

    chbxs.forEach(function (checkbox) {
        checkbox.addEventListener("change", function () {
            if (homepagecheckbox && consolewarningscheckbox) {
                localStorage.setItem('settings', JSON.stringify({ homepage: homepagecheckbox.checked, consolewarnings: consolewarningscheckbox.checked }));
            }
        });
    });

    const storedsettings = JSON.parse(localStorage.getItem('settings')) || {};
    const homepagesetting = storedsettings.homepage || false;
    const consolewarningssetting = storedsettings.consolewarnings || false;

    if(homepagecheckbox) homepagecheckbox.checked = homepagesetting;
    if(consolewarningscheckbox) consolewarningscheckbox.checked = consolewarningssetting;
}

async function loadplugins() {
    let pageContainer = document.getElementById("main");
    let settingsContent = `
        <div class="settings">
            <h1>Plugins (Beta)</h1>
            <h3>May require a refresh upon enabling/disabling</h3>
            <div class="msgs"></div>
            <div class='plugins'>
    `;

    const pluginsdata = await fetchplugins();

    pluginsdata.forEach(plugin => {
        const isEnabled = localStorage.getItem(plugin.name) === 'true';

        settingsContent += `
            <div class='plugin'>
                <h3>${plugin.name}</h3>
                <i class='desc'>Created by <a href='https://github.com/${plugin.creator}'>${plugin.creator}</a> | Installs from ${plugin.source}</i>
                <p class='desc'>${plugin.description}</p>
                <label>
                    enable
                    <input type="checkbox" id="${plugin.name}" ${isEnabled ? 'checked' : ''}>
                </label>
            </div>
        `;
    });

    settingsContent += `
        </div>
            <h1>Custom Plugin</h1>
            <h3>Caution: can be very dangerous</h3>
            <div class='customplugin'>
                <textarea class="editor" id='customplugininput' placeholder="// create plugin here"></textarea>
                <input class='cstpgbt' type='button' value='Run' onclick="customplugin()">
            </div>
        </div>
    `;
    pageContainer.innerHTML = settingsContent;

    pluginsdata.forEach(plugin => {
        const checkbox = document.getElementById(plugin.name);
        checkbox.addEventListener('change', function () {
            if (checkbox.checked) {
                localStorage.setItem(plugin.name, 'true');
                loadpluginscript(plugin.script);
            } else {
                localStorage.removeItem(plugin.name);
            }
        });
    });
}

function loadpluginscript(scriptUrl) {
    const script = document.createElement('script');
    script.src = scriptUrl;
    script.async = true;
    document.head.appendChild(script);
}

async function fetchplugins() {
    try {
        // remember to bring this back when final
        //    const response = await fetch('./plugins.json');
        const response = await fetch('plugins.json');
        const pluginsdata = await response.json();
        return pluginsdata;
    } catch (error) {
        console.error('Error fetching or parsing plugins data:', error);
        return [];
    }
}

async function loadsavedplugins() {
    const pluginsdata = await fetchplugins();
    pluginsdata.forEach(plugin => {
        const isEnabled = localStorage.getItem(plugin.name) === 'true';

        if (isEnabled) {
            loadpluginscript(plugin.script);
        }
    });
}

function customplugin() {
    const customplugininput = document.getElementById("customplugininput").value;
    if (customplugininput.trim() !== "") {
        try {
            const script = document.createElement('script');
            script.textContent = customplugininput;
            document.head.appendChild(script);
        } catch (error) {
            console.error('Something happened:', error);
        }
    }
}

function loadappearance() {
    let pageContainer = document.getElementById("main");
    let settingsContent = `
    <div class="settings">
        <h1>Appearance</h1>
        <div class="msgs example-msg">
        <div id="example" class="post" style="margin-top: -2.8em;"><div class="pfp"><img src="https://uploads.meower.org/icons/o1KPbrqDXKV6BeqmbwLvZurG" alt="Avatar" class="avatar" style="border: 3px solid #ad3e00;"></div><div class="wrapper"><div class="buttonContainer">
                    <div class="toolbarContainer">
                        <div class="toolButton">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M12.9297 3.25007C12.7343 3.05261 12.4154 3.05226 12.2196 3.24928L11.5746 3.89824C11.3811 4.09297 11.3808 4.40733 11.5739 4.60245L16.5685 9.64824C16.7614 9.84309 16.7614 10.1569 16.5685 10.3517L11.5739 15.3975C11.3808 15.5927 11.3811 15.907 11.5746 16.1017L12.2196 16.7507C12.4154 16.9477 12.7343 16.9474 12.9297 16.7499L19.2604 10.3517C19.4532 10.1568 19.4532 9.84314 19.2604 9.64832L12.9297 3.25007Z"></path><path d="M8.42616 4.60245C8.6193 4.40733 8.61898 4.09297 8.42545 3.89824L7.78047 3.24928C7.58466 3.05226 7.26578 3.05261 7.07041 3.25007L0.739669 9.64832C0.5469 9.84314 0.546901 10.1568 0.739669 10.3517L7.07041 16.7499C7.26578 16.9474 7.58465 16.9477 7.78047 16.7507L8.42545 16.1017C8.61898 15.907 8.6193 15.5927 8.42616 15.3975L3.43155 10.3517C3.23869 10.1569 3.23869 9.84309 3.43155 9.64824L8.42616 4.60245Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg class="icon" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12C2 17.515 6.486 22 12 22C14.039 22 15.993 21.398 17.652 20.259L16.521 18.611C15.195 19.519 13.633 20 12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12V12.782C20 14.17 19.402 15 18.4 15L18.398 15.018C18.338 15.005 18.273 15 18.209 15H18C17.437 15 16.6 14.182 16.6 13.631V12C16.6 9.464 14.537 7.4 12 7.4C9.463 7.4 7.4 9.463 7.4 12C7.4 14.537 9.463 16.6 12 16.6C13.234 16.6 14.35 16.106 15.177 15.313C15.826 16.269 16.93 17 18 17L18.002 16.981C18.064 16.994 18.129 17 18.195 17H18.4C20.552 17 22 15.306 22 12.782V12C22 6.486 17.514 2 12 2ZM12 14.599C10.566 14.599 9.4 13.433 9.4 11.999C9.4 10.565 10.566 9.399 12 9.399C13.434 9.399 14.6 10.565 14.6 11.999C14.6 13.433 13.434 14.599 12 14.599Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M20 6.00201H14V3.00201C14 2.45001 13.553 2.00201 13 2.00201H4C3.447 2.00201 3 2.45001 3 3.00201V22.002H5V14.002H10.586L8.293 16.295C8.007 16.581 7.922 17.011 8.076 17.385C8.23 17.759 8.596 18.002 9 18.002H20C20.553 18.002 21 17.554 21 17.002V7.00201C21 6.45001 20.553 6.00201 20 6.00201Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg class="icon_d1ac81" width="24" height="24" viewBox="0 0 24 24"><path d="M10 8.26667V4L3 11.4667L10 18.9333V14.56C15 14.56 18.5 16.2667 21 20C20 14.6667 17 9.33333 10 8.26667Z" fill="currentColor"></path></svg>
                        </div>
                    </div>
                    </div><div class="mobileContainer">
                    <div class="toolbarContainer">
                        <div class="toolButton mobileButton">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M4 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" clip-rule="evenodd" class=""></path></svg>
                        </div>
                    </div>
                    </div><h3><span id="username">melt</span><bridge title="This post has been bridged from another platform.">Bridged</bridge><i class="date">04/06/24, 11:49 pm</i></h3><p>pal was so eepy she couldn't even finish speaking!! 😹</p></div></div><div id="example" class="post"><div class="pfp"><img src="https://uploads.meower.org/icons/09M4f10bxn4AbvadnNCKZCiP" alt="Avatar" class="avatar" style="border: 3px solid #b190fe;"></div><div class="wrapper"><div class="buttonContainer">
                    <div class="toolbarContainer">
                        <div class="toolButton">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M12.9297 3.25007C12.7343 3.05261 12.4154 3.05226 12.2196 3.24928L11.5746 3.89824C11.3811 4.09297 11.3808 4.40733 11.5739 4.60245L16.5685 9.64824C16.7614 9.84309 16.7614 10.1569 16.5685 10.3517L11.5739 15.3975C11.3808 15.5927 11.3811 15.907 11.5746 16.1017L12.2196 16.7507C12.4154 16.9477 12.7343 16.9474 12.9297 16.7499L19.2604 10.3517C19.4532 10.1568 19.4532 9.84314 19.2604 9.64832L12.9297 3.25007Z"></path><path d="M8.42616 4.60245C8.6193 4.40733 8.61898 4.09297 8.42545 3.89824L7.78047 3.24928C7.58466 3.05226 7.26578 3.05261 7.07041 3.25007L0.739669 9.64832C0.5469 9.84314 0.546901 10.1568 0.739669 10.3517L7.07041 16.7499C7.26578 16.9474 7.58465 16.9477 7.78047 16.7507L8.42545 16.1017C8.61898 15.907 8.6193 15.5927 8.42616 15.3975L3.43155 10.3517C3.23869 10.1569 3.23869 9.84309 3.43155 9.64824L8.42616 4.60245Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg class="icon" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12C2 17.515 6.486 22 12 22C14.039 22 15.993 21.398 17.652 20.259L16.521 18.611C15.195 19.519 13.633 20 12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12V12.782C20 14.17 19.402 15 18.4 15L18.398 15.018C18.338 15.005 18.273 15 18.209 15H18C17.437 15 16.6 14.182 16.6 13.631V12C16.6 9.464 14.537 7.4 12 7.4C9.463 7.4 7.4 9.463 7.4 12C7.4 14.537 9.463 16.6 12 16.6C13.234 16.6 14.35 16.106 15.177 15.313C15.826 16.269 16.93 17 18 17L18.002 16.981C18.064 16.994 18.129 17 18.195 17H18.4C20.552 17 22 15.306 22 12.782V12C22 6.486 17.514 2 12 2ZM12 14.599C10.566 14.599 9.4 13.433 9.4 11.999C9.4 10.565 10.566 9.399 12 9.399C13.434 9.399 14.6 10.565 14.6 11.999C14.6 13.433 13.434 14.599 12 14.599Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M20 6.00201H14V3.00201C14 2.45001 13.553 2.00201 13 2.00201H4C3.447 2.00201 3 2.45001 3 3.00201V22.002H5V14.002H10.586L8.293 16.295C8.007 16.581 7.922 17.011 8.076 17.385C8.23 17.759 8.596 18.002 9 18.002H20C20.553 18.002 21 17.554 21 17.002V7.00201C21 6.45001 20.553 6.00201 20 6.00201Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg class="icon_d1ac81" width="24" height="24" viewBox="0 0 24 24"><path d="M10 8.26667V4L3 11.4667L10 18.9333V14.56C15 14.56 18.5 16.2667 21 20C20 14.6667 17 9.33333 10 8.26667Z" fill="currentColor"></path></svg>
                        </div>
                    </div>
                    </div><div class="mobileContainer">
                    <div class="toolbarContainer">
                        <div class="toolButton mobileButton">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M4 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" clip-rule="evenodd" class=""></path></svg>
                        </div>
                    </div>
                    </div><h3><span id="username">Eris</span><i class="date">04/06/24, 11:12 pm</i></h3><p>get ready for this</p></div></div><div id="example" class="post"><div class="pfp"><img src="https://uploads.meower.org/icons/09M4f10bxn4AbvadnNCKZCiP" alt="Avatar" class="avatar" style="border: 3px solid #b190fe;"></div><div class="wrapper"><div class="buttonContainer">
                    <div class="toolbarContainer">
                        <div class="toolButton">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M12.9297 3.25007C12.7343 3.05261 12.4154 3.05226 12.2196 3.24928L11.5746 3.89824C11.3811 4.09297 11.3808 4.40733 11.5739 4.60245L16.5685 9.64824C16.7614 9.84309 16.7614 10.1569 16.5685 10.3517L11.5739 15.3975C11.3808 15.5927 11.3811 15.907 11.5746 16.1017L12.2196 16.7507C12.4154 16.9477 12.7343 16.9474 12.9297 16.7499L19.2604 10.3517C19.4532 10.1568 19.4532 9.84314 19.2604 9.64832L12.9297 3.25007Z"></path><path d="M8.42616 4.60245C8.6193 4.40733 8.61898 4.09297 8.42545 3.89824L7.78047 3.24928C7.58466 3.05226 7.26578 3.05261 7.07041 3.25007L0.739669 9.64832C0.5469 9.84314 0.546901 10.1568 0.739669 10.3517L7.07041 16.7499C7.26578 16.9474 7.58465 16.9477 7.78047 16.7507L8.42545 16.1017C8.61898 15.907 8.6193 15.5927 8.42616 15.3975L3.43155 10.3517C3.23869 10.1569 3.23869 9.84309 3.43155 9.64824L8.42616 4.60245Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg class="icon" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12C2 17.515 6.486 22 12 22C14.039 22 15.993 21.398 17.652 20.259L16.521 18.611C15.195 19.519 13.633 20 12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12V12.782C20 14.17 19.402 15 18.4 15L18.398 15.018C18.338 15.005 18.273 15 18.209 15H18C17.437 15 16.6 14.182 16.6 13.631V12C16.6 9.464 14.537 7.4 12 7.4C9.463 7.4 7.4 9.463 7.4 12C7.4 14.537 9.463 16.6 12 16.6C13.234 16.6 14.35 16.106 15.177 15.313C15.826 16.269 16.93 17 18 17L18.002 16.981C18.064 16.994 18.129 17 18.195 17H18.4C20.552 17 22 15.306 22 12.782V12C22 6.486 17.514 2 12 2ZM12 14.599C10.566 14.599 9.4 13.433 9.4 11.999C9.4 10.565 10.566 9.399 12 9.399C13.434 9.399 14.6 10.565 14.6 11.999C14.6 13.433 13.434 14.599 12 14.599Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M20 6.00201H14V3.00201C14 2.45001 13.553 2.00201 13 2.00201H4C3.447 2.00201 3 2.45001 3 3.00201V22.002H5V14.002H10.586L8.293 16.295C8.007 16.581 7.922 17.011 8.076 17.385C8.23 17.759 8.596 18.002 9 18.002H20C20.553 18.002 21 17.554 21 17.002V7.00201C21 6.45001 20.553 6.00201 20 6.00201Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg class="icon_d1ac81" width="24" height="24" viewBox="0 0 24 24"><path d="M10 8.26667V4L3 11.4667L10 18.9333V14.56C15 14.56 18.5 16.2667 21 20C20 14.6667 17 9.33333 10 8.26667Z" fill="currentColor"></path></svg>
                        </div>
                    </div>
                    </div><div class="mobileContainer">
                    <div class="toolbarContainer">
                        <div class="toolButton mobileButton">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M4 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" clip-rule="evenodd" class=""></path></svg>
                        </div>
                    </div>
                    </div><h3><span id="username">Eris</span><i class="date">04/06/24, 11:12 pm</i></h3><p>so ur scared of helpful advice</p></div></div><div id="example" class="post"><div class="pfp"><img src="https://uploads.meower.org/icons/09M4f10bxn4AbvadnNCKZCiP" alt="Avatar" class="avatar" style="border: 3px solid #b190fe;"></div><div class="wrapper"><div class="buttonContainer">
                    <div class="toolbarContainer">
                        <div class="toolButton">
                            <svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M12.9297 3.25007C12.7343 3.05261 12.4154 3.05226 12.2196 3.24928L11.5746 3.89824C11.3811 4.09297 11.3808 4.40733 11.5739 4.60245L16.5685 9.64824C16.7614 9.84309 16.7614 10.1569 16.5685 10.3517L11.5739 15.3975C11.3808 15.5927 11.3811 15.907 11.5746 16.1017L12.2196 16.7507C12.4154 16.9477 12.7343 16.9474 12.9297 16.7499L19.2604 10.3517C19.4532 10.1568 19.4532 9.84314 19.2604 9.64832L12.9297 3.25007Z"></path><path d="M8.42616 4.60245C8.6193 4.40733 8.61898 4.09297 8.42545 3.89824L7.78047 3.24928C7.58466 3.05226 7.26578 3.05261 7.07041 3.25007L0.739669 9.64832C0.5469 9.84314 0.546901 10.1568 0.739669 10.3517L7.07041 16.7499C7.26578 16.9474 7.58465 16.9477 7.78047 16.7507L8.42545 16.1017C8.61898 15.907 8.6193 15.5927 8.42616 15.3975L3.43155 10.3517C3.23869 10.1569 3.23869 9.84309 3.43155 9.64824L8.42616 4.60245Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg class="icon" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12C2 17.515 6.486 22 12 22C14.039 22 15.993 21.398 17.652 20.259L16.521 18.611C15.195 19.519 13.633 20 12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12V12.782C20 14.17 19.402 15 18.4 15L18.398 15.018C18.338 15.005 18.273 15 18.209 15H18C17.437 15 16.6 14.182 16.6 13.631V12C16.6 9.464 14.537 7.4 12 7.4C9.463 7.4 7.4 9.463 7.4 12C7.4 14.537 9.463 16.6 12 16.6C13.234 16.6 14.35 16.106 15.177 15.313C15.826 16.269 16.93 17 18 17L18.002 16.981C18.064 16.994 18.129 17 18.195 17H18.4C20.552 17 22 15.306 22 12.782V12C22 6.486 17.514 2 12 2ZM12 14.599C10.566 14.599 9.4 13.433 9.4 11.999C9.4 10.565 10.566 9.399 12 9.399C13.434 9.399 14.6 10.565 14.6 11.999C14.6 13.433 13.434 14.599 12 14.599Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M20 6.00201H14V3.00201C14 2.45001 13.553 2.00201 13 2.00201H4C3.447 2.00201 3 2.45001 3 3.00201V22.002H5V14.002H10.586L8.293 16.295C8.007 16.581 7.922 17.011 8.076 17.385C8.23 17.759 8.596 18.002 9 18.002H20C20.553 18.002 21 17.554 21 17.002V7.00201C21 6.45001 20.553 6.00201 20 6.00201Z"></path></svg>
                        </div>
                        <div class="toolButton">
                            <svg class="icon_d1ac81" width="24" height="24" viewBox="0 0 24 24"><path d="M10 8.26667V4L3 11.4667L10 18.9333V14.56C15 14.56 18.5 16.2667 21 20C20 14.6667 17 9.33333 10 8.26667Z" fill="currentColor"></path></svg>
                        </div>
                    </div>
                    </div><div class="mobileContainer">
                    <div class="toolbarContainer">
                        <div class="toolButton mobileButton">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path fill="currentColor" fill-rule="evenodd" d="M4 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" clip-rule="evenodd" class=""></path></svg>
                        </div>
                    </div>
                    </div><h3><span id="username">Eris</span><i class="date">04/04/24, 10:49 pm</i></h3><p><a href="https://uploads.meower.org/attachments/oMZqXLbqOjb9fbkRN3VDYmI0/togif.gif" target="_blank" class="attachment"><svg class="icon_ecf39b icon__13ad2" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M10.57 4.01a6.97 6.97 0 0 1 9.86 0l.54.55a6.99 6.99 0 0 1 0 9.88l-7.26 7.27a1 1 0 0 1-1.42-1.42l7.27-7.26a4.99 4.99 0 0 0 0-7.06L19 5.43a4.97 4.97 0 0 0-7.02 0l-8.02 8.02a3.24 3.24 0 1 0 4.58 4.58l6.24-6.24a1.12 1.12 0 0 0-1.58-1.58l-3.5 3.5a1 1 0 0 1-1.42-1.42l3.5-3.5a3.12 3.12 0 1 1 4.42 4.42l-6.24 6.24a5.24 5.24 0 0 1-7.42-7.42l8.02-8.02Z" class=""></path></svg><span> attachments</span></a></p><img src="https://uploads.meower.org/attachments/oMZqXLbqOjb9fbkRN3VDYmI0/togif.gif" onclick="openImage('https://uploads.meower.org/attachments/oMZqXLbqOjb9fbkRN3VDYmI0/togif.gif')" alt="togif.gif" class="embed"></div></div>
            </div>
        <div class="theme-buttons">
            <h3>Theme</h3>
                <div class="theme-buttons-inner">
                    <button onclick='changetheme(\"light\", this)' class='theme-button light-theme'>Light</button>
                    <button onclick='changetheme(\"dark\", this)' class='theme-button dark-theme'>Dark</button>
                </div>
            <h3>Special Themes</h3>
                <div class="theme-buttons-inner">
                    <button onclick='changetheme(\"cosmic\", this)' class='theme-button cosmic-theme'>Cosmic Latte</button>
                    <button onclick='changetheme(\"bsky\", this)' class='theme-button bsky-theme'>Midnight</button>
                    <button onclick='changetheme(\"oled\", this)' class='theme-button oled-theme'>Black</button>
                    <button onclick='changetheme(\"roarer\", this)' class='theme-button roarer-theme'>Roarer</button>
                    <button onclick='changetheme(\"flamingo\", this)' class='theme-button flamingo-theme'>Flamingo</button>
                    <button onclick='changetheme(\"blurple\", this)' class='theme-button blurple-theme'>Blurple</button>
                    <button onclick='changetheme(\"grain\", this)' class='theme-button grain-theme'>Grain</button>
                    <button onclick='changetheme(\"grip\", this)' class='theme-button grip-theme'>9rip</button>
                </div>
            <h3>Accessible Themes</h3>
                <div class="theme-buttons-inner">
                    <button onclick='changetheme(\"contrast\", this)' class='theme-button contrast-theme'>High Contrast</button>
                </div>
            <h3>Original Themes</h3>
                <div class="theme-buttons-inner">
                    <button onclick='changetheme(\"oldlight\", this)' class='theme-button oldlight-theme'>Old Light</button>
                    <button onclick='changetheme(\"old\", this)' class='theme-button old-theme'>Old Dark</button>
                </div>
            <h3>Glass Themes</h3>
                <div class="theme-buttons-inner">
                    <button onclick='changetheme(\"glight\", this)' class='theme-button glight-theme'>Light</button>
                    <button onclick='changetheme(\"gdark\", this)' class='theme-button gdark-theme'>Dark</button>
                    <button onclick='imagemodal()' class='theme-button upload-button'>Add Image</button>
                </div>
            <h3>Custom Theme</h3>
                <div class="theme-buttons-inner">
                    <button onclick='changetheme(\"custom\", this)' class='theme-button custom-theme'>Custom</button>
                </div>
            </div>
            <br>
            <div class="custom-theme-in section">
                <div class="cstmeinp">
                <label for="primary">Primary Color:</label>
                <input type="color" id="primary" name="primary" value="#15a4c1">
                </div>    
                <div class="cstmeinp">
                <label for="primary">Secondary Color:</label>
                <input type="color" id="secondary" name="secondary" value="#0f788e">
                </div>
                <div class="cstmeinp">
                <label for="primary">Background Color:</label>
                <input type="color" id="background" name="background" value="#1c1f26">
                </div>
                <div class="cstmeinp">
                <label for="primary">Text Color:</label>
                <input type="color" id="color" name="color" value="#fefefe">
                </div>
                <div class="cstmeinp">
                <label for="primary">Accent Color:</label>
                <input type="color" id="accent-color" name="accent-color" value="#2f3540">
                </div>
                <div class="cstmeinp">
                <label for="primary">Accent Hover Color:</label>
                <input type="color" id="hov-accent-color" name="hov-accent-color" value="#414959">
                </div>
                <div class="cstmeinp">
                <label for="primary">Secondary Hover Color:</label>
                <input type="color" id="hov-color" name="hov-color" value="#353b49">
                </div>
                <div class="cstmeinp">
                <label for="primary">Link Color:</label>
                <input type="color" id="link-color" name="link-color" value="#00abd2">
                </div>
                <div class="cstmeinp">
                <label for="primary">Attachment Background Color:</label>
                <input type="color" id="attachment-background-color" name="attachment-background-color" value="#094c5b">
                </div>
                <div class="cstmeinp">
                <label for="primary">Attachment Text Color:</label>
                <input type="color" id="attachment-color" name="attachment-color" value="#15a4c1">
                </div>
                <div class="cstmeinp">
                <label for="primary">Attachment Hover Background Color:</label>
                <input type="color" id="attachment-background-color-hover" name="attachment-background-color-hover" value="#15a4c1">
                </div>
                <div class="cstmeinp">
                <label for="primary">Attachment Hover Text Color:</label>
                <input type="color" id="attachment-color-hover" name="attachment-color-hover" value="#fefefe">
                </div>
                <div class="cstmeinp">
                <label for="primary">Post Button Color:</label>
                <input type="color" id="button-color" name="button-color" value="#a5abb3">
                </div>
                <div class="cstmeinp">
                <label for="primary">Post Button Hover Color:</label>
                <input type="color" id="hov-button-color" name="hov-button-color" value="#fefefe">
                </div>
                <div class="cstmeinp">
                <label for="primary">Modal Background Color:</label>
                <input type="color" id="modal-color" name="modal-color" value="#2f3540">
                </div>
                <div class="cstmeinp">
                <label for="primary">Modal Button Color:</label>
                <input type="color" id="modal-button-color" name="modal-button-color" value="#414959">
                </div>
                <div class="cstmeinp">
                <label for="primary">Modal Button Hover Color:</label>
                <input type="color" id="hov-modal-button-color" name="hov-modal-button-color" value="#4d576a">
                </div>
            </div>
            <button onclick="applycsttme()" class="cstpgbt button">Apply</button>
        <h3>Custom CSS</h3>
        <div class='customcss'>
            <textarea class="editor" id='customcss' placeholder="// you put stuff here"></textarea>
        </div>
    </div>
    `

    pageContainer.innerHTML = settingsContent;

    const customThemeCSS = localStorage.getItem('customThemeCSS');

    if (customThemeCSS) {
        const regex = /--(.*?):(.*?);/g;
        let match;
        while ((match = regex.exec(customThemeCSS)) !== null) {
            const propertyName = match[1].trim();
            const propertyValue = match[2].trim();

            const inputElement = document.getElementById(propertyName);
            if (inputElement) {
                inputElement.value = propertyValue;
            }
        }
    }

    const css = localStorage.getItem('customCSS');
    const cstmcsstxt = document.getElementById('customcss');
    cstmcsstxt.value = css || '';

    cstmcsstxt.addEventListener('input', function () {
        const newCustomCSS = cstmcsstxt.value;

        let customstyle = document.getElementById('customstyle');
        if (!customstyle) {
            customstyle = document.createElement('style');
            customstyle.id = 'customstyle';
            document.head.appendChild(customstyle);
        }

        customstyle.textContent = newCustomCSS;

        localStorage.setItem('customCSS', newCustomCSS);
    });

    const themeButtons = document.querySelectorAll('.theme-button');
    themeButtons.forEach((btn) => btn.classList.remove('selected'));
    document.querySelector('.theme-buttons .' + localStorage.getItem('theme') + '-theme').classList.add('selected');
}

function applycsttme() {
    const customThemeParameters = document.querySelectorAll('.custom-theme-in input[type="color"]');
    let customThemeCSS = '';

    customThemeParameters.forEach(input => {
        const propertyName = input.name;
        const propertyValue = input.value;
        customThemeCSS += `--${propertyName}: ${propertyValue};`;
    });

    const customThemeStyle = document.createElement('style');
    customThemeStyle.textContent = `.custom-theme { ${customThemeCSS} }`;
    document.head.appendChild(customThemeStyle);

    localStorage.setItem('customThemeCSS', customThemeCSS);
}

function loadcsttme() {
    const customThemeCSS = localStorage.getItem('customThemeCSS');
    if (customThemeCSS) {
        const customThemeStyle = document.createElement('style');
        customThemeStyle.textContent = `.custom-theme { ${customThemeCSS} }`;
        document.head.appendChild(customThemeStyle);
    }
}

function loadcstmcss() {
    const css = localStorage.getItem('customCSS');

    let customstyle = document.getElementById('customstyle');
    if (!customstyle) {
        customstyle = document.createElement('style');
        customstyle.id = 'customstyle';
        document.head.appendChild(customstyle);
    }

    customstyle.textContent = css || '';
}

function changetheme(theme, button) {
    const selectedTheme = theme;

    const previousTheme = localStorage.getItem("theme");
    if (previousTheme) {
        document.documentElement.classList.remove(previousTheme + "-theme");
    }
    document.documentElement.classList.add(selectedTheme + "-theme");
    localStorage.setItem("theme", selectedTheme);

    const themeColorMetaTag = document.querySelector('meta[name="theme-color"]');
    themeColorMetaTag.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--background'));

    const themeButtons = document.querySelectorAll('.theme-button');
    themeButtons.forEach((btn) => btn.classList.remove('selected'));
    button.classList.add('selected');
    const lightThemeBody = document.querySelector('body');
    if (lightThemeBody) {
        lightThemeBody.style.backgroundImage = ``;
    }
    loadBG();
}

function settingsstuff() {
    const storedsettings = localStorage.getItem('settings');
    if (!storedsettings) {
        const defaultSettings = {
            swearfilter: false,
        };
        localStorage.setItem('settings', JSON.stringify(defaultSettings));
        return defaultSettings;
    }

    return JSON.parse(storedsettings);
}

function formattime(timestamp) {
    const now = new Date();
    const timeDiff = now.getTime() - timestamp;
    const seconds = Math.floor(timeDiff / 1000);

    if (seconds < 60) {
        return seconds + (seconds === 1 ? ' second ago' : ' seconds ago');
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    }

    const days = Math.floor(hours / 24);

    return days + (days === 1 ? ' day ago' : ' days ago');
}

function ping() {
    meowerConnection.send(JSON.stringify({
        cmd: "ping",
        val: ""
    }));
}

function launchscreen() {
    page = "load";
    const green = `<div class="launch">
        <svg class="launch-logo" width="128" height="128" viewBox="0 0 512 512" fill="var(--color)" xmlns="http://www.w3.org/2000/svg">
        <g>
            <path d="M468.42 20.5746L332.997 65.8367C310.218 58.8105 284.517 55.049 255.499 55.6094C226.484 55.049 200.78 58.8105 178.004 65.8367L42.5803 20.5746C18.9102 16.3251 -1.81518 36.2937 2.5967 59.1025L38.7636 200.894C18.861 248.282 12.1849 296.099 12.1849 325.027C12.1849 399.343 44.6613 492 255.499 492C466.339 492 498.815 399.343 498.815 325.027C498.815 296.099 492.139 248.282 472.237 200.894L508.404 59.1025C512.814 36.2937 492.09 16.3251 468.42 20.5746Z"/>
        </g>
        </svg>
    </div>`
    const orange = document.getElementById("main");
    orange.innerHTML = green;

    let nv = document.getElementById("nav");
    nv.innerHTML = ``;
    nv = document.getElementById("groups");
    nv.innerHTML = ``;
    // this should be launching the launch screen not vice versa
    meowerConnection.close();
}

function autoresize() {
    const textarea = document.getElementById('msg');
    textarea.style.height = 'auto';
    textarea.style.height = (((textarea.scrollHeight)) - 26) + 'px';
}

async function deletePost(postid) {
    try {
        const response = await fetch(`https://api.meower.org/posts?id=${postid}`, {
            method: "DELETE",
            headers: {
                "token": localStorage.getItem("token")
            }
        });

        if (response.ok) {
            console.log(`Post with ID ${postid} deleted successfully.`);
            closemodal();
        } else {
            console.error(`Error deleting post with ID ${postid}: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error deleting post:", error);
    }
}

function editPost(postOrigin, postid) {
    const post = postCache[postOrigin].find(post => post._id === postid);
    if (!post) return;

    const editIndicator = document.getElementById("edit-indicator");
    editIndicator.setAttribute("data-postid", postid);
    editIndicator.innerHTML = `
    <span class="edit-info">Editing post ${postid}</span>
    <span onclick="cancelEdit()">
    <svg width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M2.05026 11.9497C4.78394 14.6834 9.21607 14.6834 11.9497 11.9497C14.6834 9.21607 14.6834 4.78394 11.9497 2.05026C9.21607 -0.683419 4.78394 -0.683419 2.05026 2.05026C-0.683419 4.78394 -0.683419 9.21607 2.05026 11.9497ZM9.3065 10.2946L7.00262 7.99112L4.69914 10.295C4.42624 10.5683 3.98395 10.5683 3.71065 10.295C3.43754 10.0219 3.43754 9.5788 3.71065 9.3065L6.01432 7.00282L3.7048 4.69371C3.4317 4.4206 3.4317 3.97791 3.7048 3.7048C3.97751 3.4317 4.4202 3.4317 4.6933 3.7048L7.00262 6.01412L9.3065 3.71065C9.4791 3.53764 9.71978 3.4742 9.94253 3.52012C10.0718 3.5467 10.1949 3.61014 10.2952 3.71044C10.5683 3.98315 10.5683 4.42624 10.2952 4.69894L7.99132 7.00242L10.295 9.30609C10.5683 9.579 10.5683 10.0213 10.295 10.2946C10.0221 10.5679 9.5794 10.5679 9.3065 10.2946Z" fill="currentColor"/>
    </svg>
    </span>
`;

    const msgbox = document.getElementById("msg");
    msgbox.value = post.unfiltered_p || post.p;
    msgbox.focus();
    autoresize();
    closemodal();
}

function cancelEdit() {
    const editIndicator = document.getElementById("edit-indicator");
    editIndicator.removeAttribute("data-postid");
    editIndicator.innerText = "";
    document.getElementById('msg').value = "";
    autoresize();
}

function openImage(url) {
    const baseURL = url.split('?')[0];
    const fileName = baseURL.split('/').pop();

    document.documentElement.style.overflow = "hidden";
    const mdlbck = document.querySelector('.image-back');

    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.image-mdl');
        if (mdl) {
            mdl.innerHTML = `
            <img class='embed-large' src='${url}' alt="${fileName}" onclick='preventClose(event)'>
            <div class="img-links">
            <span class="img-link-outer"><a onclick="closeImage()" class="img-link">close</a></span>
            <span><a href="${url}" target="_blank" class="img-link">open in browser</a></span>
            </div>
            `;
        }
    }
}

function preventClose(event) {
    event.stopPropagation();
}

function closeImage() {
    document.documentElement.style.overflow = "";

    const mdlbck = document.querySelector('.image-back');

    if (mdlbck) {
        mdlbck.style.display = 'none';
    }

    const mdl = document.querySelector('.image-mdl');

    if (mdlbck) {
        mdl.style.background = '';
        mdl.classList.remove('custom-bg');
        mdl.innerHTML = '';
    }
}

function createChat() {
    const nickname = document.getElementById("chat-nick-input").value.trim();
    if (nickname.length < 1) {
        openUpdate("Chat nickname too short!");
        return;
    } else if (nickname.length > 20) {
        openUpdate("Chat nickname too long!");
        return;
    }
    fetch("https://api.meower.org/chats", {
        method: "POST",
        headers: {
            token: localStorage.getItem("token"),
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ nickname })
    })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            chatCache[data._id] = data;
            loadchat(data._id);
            closemodal();
        })
        .catch(e => {
            openUpdate(`Failed to create chat: ${e}`);
        });
}

function openModal(postId) {
    document.documentElement.style.overflow = "hidden";
    const mdlbck = document.querySelector('.modal-back');

    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.modal');
        if (mdl) {
            mdl.id = postId;
            let mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = `
                <button class="modal-back-btn" onclick="openModModal();">back</button>
                `;
            }
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                <button class="modal-button" onclick="mdlreply(event)"><div>Reply</div><div class="modal-icon"><svg class="icon_d1ac81" width="24" height="24" viewBox="0 0 24 24"><path d="M10 8.26667V4L3 11.4667L10 18.9333V14.56C15 14.56 18.5 16.2667 21 20C20 14.6667 17 9.33333 10 8.26667Z" fill="currentColor"></path></svg></div></button>
                <button class="modal-button" onclick="mdlpingusr(event)"><div>Mention</div><div class="modal-icon"><svg class="icon" height="24" width="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12C2 17.515 6.486 22 12 22C14.039 22 15.993 21.398 17.652 20.259L16.521 18.611C15.195 19.519 13.633 20 12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12V12.782C20 14.17 19.402 15 18.4 15L18.398 15.018C18.338 15.005 18.273 15 18.209 15H18C17.437 15 16.6 14.182 16.6 13.631V12C16.6 9.464 14.537 7.4 12 7.4C9.463 7.4 7.4 9.463 7.4 12C7.4 14.537 9.463 16.6 12 16.6C13.234 16.6 14.35 16.106 15.177 15.313C15.826 16.269 16.93 17 18 17L18.002 16.981C18.064 16.994 18.129 17 18.195 17H18.4C20.552 17 22 15.306 22 12.782V12C22 6.486 17.514 2 12 2ZM12 14.599C10.566 14.599 9.4 13.433 9.4 11.999C9.4 10.565 10.566 9.399 12 9.399C13.434 9.399 14.6 10.565 14.6 11.999C14.6 13.433 13.434 14.599 12 14.599Z"></path></svg></div></button>
                <button class="modal-button" onclick="reportModal(event)"><div>Report</div><div class="modal-icon"><svg height="20" width="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M20 6.00201H14V3.00201C14 2.45001 13.553 2.00201 13 2.00201H4C3.447 2.00201 3 2.45001 3 3.00201V22.002H5V14.002H10.586L8.293 16.295C8.007 16.581 7.922 17.011 8.076 17.385C8.23 17.759 8.596 18.002 9 18.002H20C20.553 18.002 21 17.554 21 17.002V7.00201C21 6.45001 20.553 6.00201 20 6.00201Z"></path></svg></div></button>      
                <button class="modal-button" onclick="mdlshare(event)"><div>Share</div><div class="modal-icon"><svg viewBox="0 0 20 20" fill="currentColor" width="18" height="18"><path d="M12.9297 3.25007C12.7343 3.05261 12.4154 3.05226 12.2196 3.24928L11.5746 3.89824C11.3811 4.09297 11.3808 4.40733 11.5739 4.60245L16.5685 9.64824C16.7614 9.84309 16.7614 10.1569 16.5685 10.3517L11.5739 15.3975C11.3808 15.5927 11.3811 15.907 11.5746 16.1017L12.2196 16.7507C12.4154 16.9477 12.7343 16.9474 12.9297 16.7499L19.2604 10.3517C19.4532 10.1568 19.4532 9.84314 19.2604 9.64832L12.9297 3.25007Z"></path><path d="M8.42616 4.60245C8.6193 4.40733 8.61898 4.09297 8.42545 3.89824L7.78047 3.24928C7.58466 3.05226 7.26578 3.05261 7.07041 3.25007L0.739669 9.64832C0.5469 9.84314 0.546901 10.1568 0.739669 10.3517L7.07041 16.7499C7.26578 16.9474 7.58465 16.9477 7.78047 16.7507L8.42545 16.1017C8.61898 15.907 8.6193 15.5927 8.42616 15.3975L3.43155 10.3517C3.23869 10.1569 3.23869 9.84309 3.43155 9.64824L8.42616 4.60245Z"></path></svg></div></button>      
                `;

                const postDiv = document.getElementById(postId);
                const usernameElement = postDiv.querySelector('#username').innerText;

                if (usernameElement === localStorage.getItem("uname")) {
                    mdlt.innerHTML += `
                    <button class="modal-button" onclick="deletePost('${postId}')"><div>Delete</div><div class="modal-icon"><svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z"></path><path fill="currentColor" d="M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z"></path></svg></div></button>      
                    <button class="modal-button" onclick="editPost('${page}', '${postId}')"><div>Edit</div><div class="modal-icon"><svg width="20" height="20" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M19.2929 9.8299L19.9409 9.18278C21.353 7.77064 21.353 5.47197 19.9409 4.05892C18.5287 2.64678 16.2292 2.64678 14.817 4.05892L14.1699 4.70694L19.2929 9.8299ZM12.8962 5.97688L5.18469 13.6906L10.3085 18.813L18.0201 11.0992L12.8962 5.97688ZM4.11851 20.9704L8.75906 19.8112L4.18692 15.239L3.02678 19.8796C2.95028 20.1856 3.04028 20.5105 3.26349 20.7337C3.48669 20.9569 3.8116 21.046 4.11851 20.9704Z" fill="currentColor"></path></svg></div></button>      
                    `;
                }

                if (localStorage.getItem("permissions") === "1") {
                    mdlt.innerHTML += `
                    <button class="modal-button" onclick="modPostModal('${postId}')"><div>Moderate</div><div class="modal-icon"><svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.00001C15.56 6.00001 12.826 2.43501 12.799 2.39801C12.421 1.89801 11.579 1.89801 11.201 2.39801C11.174 2.43501 8.44 6.00001 5 6.00001C4.447 6.00001 4 6.44801 4 7.00001V14C4 17.807 10.764 21.478 11.534 21.884C11.68 21.961 11.84 21.998 12 21.998C12.16 21.998 12.32 21.96 12.466 21.884C13.236 21.478 20 17.807 20 14V7.00001C20 6.44801 19.553 6.00001 19 6.00001ZM15 16L12 14L9 16L10 13L8 11H11L12 8.00001L13 11H16L14 13L15 16Z"></path></svg></div></button>      
                    `;
                }
            }
            mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = ``;
            }
        }
    }
}

function openUsrModal(uId) {
    document.documentElement.style.overflow = "hidden";

    const mdlbck = document.querySelector('.modal-back');

    if (mdlbck) {
        mdlbck.style.display = 'flex';
        const mdl = mdlbck.querySelector('.modal');
        if (mdl) {
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                <iframe class="profile" src="users.html?u=${uId}"></iframe>
                `;

                fetch(`https://api.meower.org/users/${uId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.avatar_color !== "!color") {
                            const clr1 = darkenColour(data.avatar_color, 3);
                            const clr2 = darkenColour(data.avatar_color, 5);
                            mdl.style.background = `linear-gradient(180deg, ${clr1} 0%, ${clr2} 100%`;
                            mdl.classList.add('custom-bg');
                        }
                    })
                    .catch(error => console.error('Error fetching user profile:', error));
            }
        }
        const mdbt = mdl.querySelector('.modal-bottom');
        if (mdbt) {
            mdbt.innerHTML = ``;
        }
    }
}

function reportModal(id) {
    document.documentElement.style.overflow = "hidden";

    const mdlbck = document.querySelector('.modal-back');

    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.modal');
        if (mdl) {
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                <h3>Report Post</h3>
                <hr class="mdl-hr">
                <span class="subheader">Reason</span>
                <select id="report-reason" class="modal-select">
                <option value="Spam">Spam</option>
                    <option value="Harassment or abuse towards others">Harassment or abuse towards others</option>
                    <option value="Rude, vulgar or offensive language">Rude, vulgar or offensive language</option>
                    <option value="NSFW (sexual, alcohol, violence, gore, etc.)">NSFW (sexual, alcohol, violence, gore, etc.)</option>
                    <option value="Scams, hacks, phishing or other malicious content">Scams, hacks, phishing or other malicious content</option>
                    <option value="Threatening violence or real world harm">Threatening violence or real world harm</option>
                    <option value="Illegal activity">Illegal activity</option><option value="Self-harm/suicide">Self-harm/suicide</option>
                    <option value="Other">This person is too young to use Meower</option>
                    <option value="Other">Other</option>
                    </select>
                <span class="subheader">Comment</span>
                <textarea class="mdl-txt" id="report-comment"></textarea>
                <button class="modal-button" onclick="sendReport('${id}')">Send Report</button>
                `;
            }
            const mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = ``;
            }
        }
    }
}

function uploadModal() {
    document.documentElement.style.overflow = "hidden";

    const mdlbck = document.querySelector('.modal-back');

    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.modal');
        if (mdl) {
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                <h3>Upload image</h3>
                <hr class="mdl-hr">
                <form id="upload-form">
                    <input type="file" id="image-upload" name="image" accept=".jpg,.jpeg,.png,.bmp,.gif,.tif,.webp,.heic,.avif" required>
                    <button type="submit" class="modal-button">Upload</button>
                </form>
                `;
            }
            const mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = ``;
            }
        }
    }

    const form = document.getElementById('upload-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get a reference to the upload button
        const uploadButton = document.querySelector('.modal-button');
        // Disable the button and change its text
        uploadButton.disabled = true;
        uploadButton.textContent = 'Uploading...';

        const formData = new FormData();
        formData.append('image', document.getElementById('image-upload').files[0]);
        formData.append('username', 'Test');

        fetch('https://leoimages.atticat.tech/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            closemodal();
            const textarea = document.querySelector('.message-input.text');
            textarea.value += data.image_url += '\n';
            autoresize();
        })
        .catch(error => console.error('Error:', error))
        .finally(() => {
            // Enable the button and change its text back to "Upload"
            uploadButton.disabled = false;
            uploadButton.textContent = 'Upload';
        });
    });
}

function sendReport(id) {
    const data = {
        cmd: "direct",
        val: {
            cmd: "report",
            val: {
                type: 0,
                id: id,
                reason: document.getElementById('report-reason').value,
                comment: document.getElementById('report-comment').value
            }
        }
    };
    meowerConnection.send(JSON.stringify(data));
    console.log("Report Sent!");
    closemodal("Report Sent!");
}

async function closemodal(message) {
    document.documentElement.style.overflow = "";

    const mdlbck = document.querySelector('.modal-back');

    if (mdlbck) {
        mdlbck.style.display = 'none';
    }

    const mdl = document.querySelector('.modal');

    if (mdlbck) {
        mdl.id = '';
        mdl.style.background = '';
        mdl.classList.remove('custom-bg');
    }

    if (message) {
        const delay = ms => new Promise(res => setTimeout(res, ms));
        await delay(100);
        openUpdate(message);
    }
}

function openModModal() {
    document.documentElement.style.overflow = "hidden";

    const mdlbck = document.querySelector('.modal-back');

    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.modal');
        mdl.id = 'mdl-big';
        if (mdl) {
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                <h3>Moderation Panel</h3>
                <hr class="mdl-hr">
                <span class="subheader">Moderate User (Case Sensitive)</span>
                <div class="mod-goto">
                <form class="section-form" onsubmit="modgotousr();">
                <input type="text" class="mdl-inp" id="usrinpmd" placeholder="Tnix">
                <button class="md-inp-btn button">Go!</button>
                </form>
                </div>
                <span class="subheader">Actions</span>
                
                <div class="mod-actions">
                <button class="modal-button md-fx">Kick Everyone</button>
                <button class="modal-button md-fx">Enable Repair Mode</button>
                <button class="modal-button md-fx">Disable Registration</button>
                </div>
                <span class="subheader">Reports</span>
                <div class="mod-reports mdl-ovr"></div>

                `;
                loadreports();
            }
            const mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = ``;
            }
        }
    }
}

async function loadreports() {
    fetch("https://api.meower.org/admin/reports?autoget=1&page=1&status=pending", {
        method: "GET",
        headers: {
            "token": localStorage.getItem("token")
        }
    })
        .then(response => response.json())
        .then(data => {
            const reports = data.autoget;
            const modreports = document.querySelector('.modal-top');

            reports.forEach(report => {
                if (report.type === 'post') {
                    const rprtbx = document.createElement('div');
                    rprtbx.classList.add('report-box');
                    rprtbx.innerHTML = `
                    <div class="buttonContainer">
                        <div class='toolbarContainer'>
                            <div class='toolButton' onclick='closeReport("${report._id}", "false")'>
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.3527 12.0051L19.8447 6.51314C20.496 5.86247 20.496 4.80714 19.8447 4.15647C19.1933 3.50514 18.1387 3.50514 17.488 4.15647L11.996 9.64847L6.50401 4.15647C5.85334 3.50514 4.79734 3.50514 4.14734 4.15647C3.49601 4.80714 3.49601 5.86247 4.14734 6.51314L9.63934 12.0051L4.13401 17.5105C3.48267 18.1618 3.48267 19.2165 4.13401 19.8671C4.45934 20.1925 4.88601 20.3551 5.31267 20.3551C5.73934 20.3551 6.16601 20.1925 6.49134 19.8671L11.9967 14.3611L17.4887 19.8531C17.814 20.1785 18.2407 20.3411 18.6673 20.3411C19.094 20.3411 19.52 20.1785 19.846 19.8531C20.4973 19.2018 20.4973 18.1471 19.846 17.4965L14.3527 12.0051Z" fill="currentColor"/></svg>
                            </div>
                            <div class='toolButton' onclick='closeReport("${report._id}", "true")'>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.52 4.24127C18.7494 3.7406 17.7174 3.95993 17.2147 4.73193L9.95735 15.9179L6.60468 12.8179C5.92868 12.1926 4.87402 12.2346 4.24935 12.9099C3.62468 13.5859 3.66602 14.6406 4.34202 15.2653L9.14802 19.7093C9.46802 20.0059 9.87468 20.1526 10.2787 20.1526C10.7274 20.1526 11.3014 19.9646 11.678 19.3933C11.8994 19.0559 20.0114 6.5466 20.0114 6.5466C20.512 5.77393 20.292 4.74193 19.52 4.24127Z" fill="currentColor"/></svg>
                            </div>
                        </div>
                    </div>
                    <p>ID: ${report._id}</p>
                    <p>Type: ${report.type}</p>
                    <p>Status: ${report.status}</p>
                    <p>Origin: ${report.content.post_origin}</p>
                    <ul class="reports-list"></ul>
                    
                    <div class="report-post" id="username" onclick="modPostModal('${report.content._id}')">
                        <div class="pfp">
                            <img src="" alt="Avatar" class="avatar" style="border: 3px solid rgb(15, 15, 15);">
                        </div>
                        <div class="wrapper">
                        <h3><span class="username">${escapeHTML(report.content.u)}</span></h3>
                        <p>${escapeHTML(report.content.p)}</p>
                        </div>
                    </div>
                `;

                    modreports.appendChild(rprtbx);

                    const reportsList = rprtbx.querySelector('.reports-list');

                    report.reports.forEach(item => {
                        reportsList.innerHTML += `
                    <li>
                        <p>User: ${item.user}</p>
                        <p>Reason: ${item.reason}</p>
                        <p>Comment: ${item.comment}</p>
                    </li>
                    `;

                        loadPfp(report.content.u, 1)
                            .then(pfpElement => {
                                if (pfpElement) {
                                    const rpfp = rprtbx.querySelector('.avatar');
                                    rpfp.replaceWith(pfpElement);
                                }
                            });
                    });

                } else if (report.type === 'user') {
                    const rprtbx = document.createElement('div');
                    rprtbx.classList.add('report-box');
                    rprtbx.innerHTML = `
                    <div class="buttonContainer">
                        <div class='toolbarContainer'>
                            <div class='toolButton' onclick='closeReport("${report._id}", "false")'>
                                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.3527 12.0051L19.8447 6.51314C20.496 5.86247 20.496 4.80714 19.8447 4.15647C19.1933 3.50514 18.1387 3.50514 17.488 4.15647L11.996 9.64847L6.50401 4.15647C5.85334 3.50514 4.79734 3.50514 4.14734 4.15647C3.49601 4.80714 3.49601 5.86247 4.14734 6.51314L9.63934 12.0051L4.13401 17.5105C3.48267 18.1618 3.48267 19.2165 4.13401 19.8671C4.45934 20.1925 4.88601 20.3551 5.31267 20.3551C5.73934 20.3551 6.16601 20.1925 6.49134 19.8671L11.9967 14.3611L17.4887 19.8531C17.814 20.1785 18.2407 20.3411 18.6673 20.3411C19.094 20.3411 19.52 20.1785 19.846 19.8531C20.4973 19.2018 20.4973 18.1471 19.846 17.4965L14.3527 12.0051Z" fill="currentColor"/></svg>
                            </div>
                            <div class='toolButton' onclick='closeReport("${report._id}", "true")'>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.52 4.24127C18.7494 3.7406 17.7174 3.95993 17.2147 4.73193L9.95735 15.9179L6.60468 12.8179C5.92868 12.1926 4.87402 12.2346 4.24935 12.9099C3.62468 13.5859 3.66602 14.6406 4.34202 15.2653L9.14802 19.7093C9.46802 20.0059 9.87468 20.1526 10.2787 20.1526C10.7274 20.1526 11.3014 19.9646 11.678 19.3933C11.8994 19.0559 20.0114 6.5466 20.0114 6.5466C20.512 5.77393 20.292 4.74193 19.52 4.24127Z" fill="currentColor"/></svg>
                            </div>
                        </div>
                    </div>
                    <p>ID: ${report._id}</p>
                    <p>Type: ${report.type}</p>
                    <p>Status: ${report.status}</p>
                    <ul class="reports-list"></ul>
                    
                    <div class="report-user" id="username" onclick="modUserModal('${report.content._id}')">
                    <div class="pfp">
                        <img src="" alt="Avatar" class="avatar" style="border: 3px solid rgb(15, 15, 15);">
                    </div>    
                    <div class="wrapper">
                        <h3><span>${report.content._id}</span></h3>
                        <p>${report.content.quote}</p>
                    </div>
                    </div>
                `;

                    modreports.appendChild(rprtbx);

                    const reportsList = rprtbx.querySelector('.reports-list');

                    report.reports.forEach(item => {
                        reportsList.innerHTML += `
                    <li>
                        <p>User: ${item.user}</p>
                        <p>Reason: ${item.reason}</p>
                        <p>Comment: ${item.comment}</p>
                    </li>
                    `;

                        const rpfp = rprtbx.querySelector('.avatar');
                        if (report.content.avatar) {
                            rpfp.src = `https://uploads.meower.org/icons/${report.content.avatar}`
                            rpfp.style = `border: 3px solid #${report.content.avatar_color};background-color:#${report.content.avatar_color};`
                        } else {
                            rpfp.src = `images/avatars/icon_${report.content.pfp_data - 1}.svg`
                            rpfp.style = `border: 3px solid #${report.content.avatar_color};background-color:#fff;`
                        }
                    });
                }
            });
        })
        .catch(error => {
            console.error("Error loading reports:", error);
        });

}

function modUserModal(user) {
    document.documentElement.style.overflow = "hidden";

    const mdlbck = document.querySelector('.modal-back');

    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.modal');
        mdl.id = 'mdl-big';
        mdl.style.background = '';
        mdl.classList.remove('custom-bg');
        if (mdl) {
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                <h3>Moderate ${user}</h3>
                <hr class="mdl-hr">
                <div class="mod-user"></div>
                `;
                loadmoduser(user);
            }
            const mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = `
                <button class="modal-back-btn" onclick="openModModal();">back</button>
                `;
            }
        }
    }
}

async function loadmoduser(user) {
    fetch(`https://api.meower.org/admin/users/${user}`, {
        method: "GET",
        headers: {
            "token": localStorage.getItem("token")
        }
    })
        .then(response => response.json())
        .then(data => {
            const modusr = document.querySelector('.mod-user');
            modusr.innerHTML = `
        <span class="subheader">User Info</span>
        <div class="mod-post">
        <div class="pfp">
            <img src="" alt="Avatar" class="avatar" style="">
        </div>
        <div class="wrapper">
            <h3><span>${data._id}</span></h3>
            <p>${data.quote}</p>
        </div>
        </div>
            <span class="subheader">User Info</span>
            <ul>
            <li>UUID: ${data.uuid}</li>
            <li>Flags: ${data.flags}</li>
            <li>Permissions: ${data.permissions}</li>
            <li>Pfp: ${data.pfp_data}</li>
            </ul>
            <span class="subheader">Alts</span>
            <ul id="alts">
            </ul>
            <span class="subheader">Recent IPs</span>
            <div id="ips" class="mod-table">
            <div class="table-section">
                <div class="mod-td">IP Address</div>
                <div class="mod-td">Last Used</div>
                <div class="mod-td">Flags</div>
            </div>
            </div>
            <span class="subheader">Note</span>
            <textarea id="mod-post-note" class="mdl-txt"></textarea>
            <button class="modal-button" onclick="updateNote('${data.uuid}')">Update Note</button>
            <span class="subheader">Alert</span>
            <textarea id="mod-user-alert" class="mdl-txt"></textarea>
            <button class="modal-button" onclick="sendAlert('${data._id}')">Send Alert</button>
        `;

            const rpfp = document.querySelector('.mod-post .avatar');
            if (data.avatar) {
                rpfp.src = `https://uploads.meower.org/icons/${data.avatar}`;
                rpfp.style.border = `3px solid #${data.avatar_color}`;
                rpfp.style.backgroundColor = `#${data.avatar_color}`;
            } else if (data.pfp_data) {
                // legacy avatars
                rpfp.src = `images/avatars/icon_${data.pfp_data - 1}.svg`;
                rpfp.classList.add('svg-avatar');
                rpfp.style.border = `3px solid #${data.avatar_color}`;
                rpfp.style.backgroundColor = `#fff`;
            } else {
                rpfp.src = `images/avatars/icon_-4.svg`;
                rpfp.classList.add('svg-avatar');
                rpfp.style.border = `3px solid #fff`;
                rpfp.style.backgroundColor = `#fff`;
            }

            const altlist = modusr.querySelector('#alts');
            const iplist = modusr.querySelector('#ips');

            data.alts.forEach(item => {
                altlist.innerHTML += `
            <li>
                <span id="username" onclick="modUserModal('${item}')">${item}</span>
            </li>
            `;
            });

            data.recent_ips.forEach(item => {
                iplist.innerHTML += `
            <div class="table-section">
                <div class="mod-td" onclick="openUpdate('${item.netinfo._id}')">${item.ip}</div>
                <div class="mod-td">${createDate(item.last_used)}</div>
                <div class="mod-td">${item.netinfo.vpn}</div>
            </div>
            `;
            });

            fetch(`https://api.meower.org/admin/notes/${data.uuid}`, {
                method: "GET",
                headers: {
                    "token": localStorage.getItem("token")
                }
            })
                .then(response => response.json())
                .then(noteData => {
                    if (noteData && noteData.notes) {
                        const mdpsnt = document.getElementById('mod-post-note');
                        mdpsnt.value = noteData.notes;
                    } else {
                        console.log("No data received from server, the note is probably blank");
                    }
                })
                .catch(error => {
                    console.error("Error loading note data:", error);
                });

        })
        .catch(error => {
            console.error("Error loading post:", error);
        });
}

function modPostModal(postid) {
    document.documentElement.style.overflow = "hidden";

    const mdlbck = document.querySelector('.modal-back');

    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.modal');
        mdl.id = 'mdl-big';
        if (mdl) {
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                <h3>Moderate ${postid}</h3>
                <hr class="mdl-hr">
                <span class="subheader">Post</span>
                <div class="mod-posts"></div>
                <span class="subheader">Note</span>

                <textarea id="mod-post-note" class="mdl-txt"></textarea>
                <button class="modal-button" onclick="updateNote('${postid}')">Update Note</button>
                `;
                loadmodpost(postid);
            }
            const mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = `
                <button class="modal-back-btn" onclick="openModModal();">back</button>
                `;
            }
        }
    }
}

async function loadmodpost(postid) {
    fetch(`https://api.meower.org/admin/posts/${postid}`, {
        method: "GET",
        headers: {
            "token": localStorage.getItem("token")
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data) {
                fetch(`https://api.meower.org/users/${data.u}`)
                    .then(response => response.json())
                    .then(userData => {
                        if (userData) {
                            if (data.unfiltered_p) {
                                const modpst = document.querySelector('.mod-posts');
                                modpst.innerHTML = `
                                <div class="mod-post">
                                    <div class="pfp">
                                        <img src="" alt="Avatar" class="avatar" style="" onclick="modUserModal('${data.u}')">
                                    </div>
                                    <div class="wrapper">
                                    <div class="mdbtcntner">
                                        <div class='toolButton' onclick='modDeletePost("${postid}")'>
                                            <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z"></path><path fill="currentColor" d="M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z"></path></svg>
                                        </div>
                                    </div>    
                                    <h3><span id="username" onclick="modUserModal('${data.u}')">${data.u}</span></h3>
                                        <p>${data.unfiltered_p}</p>
                                    </div>
                                </div>
                            `;
                            } else {
                                const modpst = document.querySelector('.mod-posts');
                                modpst.innerHTML = `
                                <div class="mod-post">
                                    <div class="pfp">
                                        <img src="" alt="Avatar" class="avatar" style="" onclick="modUserModal('${data.u}')">
                                    </div>
                                    <div class="wrapper">
                                    <div class="mdbtcntner">
                                        <div class='toolButton' onclick='modDeletePost("${postid}")'>
                                            <svg width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z"></path><path fill="currentColor" d="M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z"></path></svg>
                                        </div>
                                    </div>    
                                    <h3><span id="username" onclick="modUserModal('${data.u}')">${data.u}</span></h3>
                                        <p>${data.p}</p>
                                    </div>
                                </div>
                            `;
                            }
                            const rpfp = document.querySelector('.mod-posts .avatar');
                            if (userData.avatar) {
                                rpfp.src = `https://uploads.meower.org/icons/${userData.avatar}`;
                                rpfp.style.border = `3px solid #${userData.avatar_color}`;
                                rpfp.style.backgroundColor = `#${userData.avatar_color}`;
                            } else {
                                // legacy avatars
                                rpfp.src = `images/avatars/icon_${userData.pfp_data - 1}.svg`;
                                rpfp.classList.add('svg-avatar');
                            }

                            fetch(`https://api.meower.org/admin/notes/${postid}`, {
                                method: "GET",
                                headers: {
                                    "token": localStorage.getItem("token")
                                }
                            })
                                .then(response => response.json())
                                .then(noteData => {
                                    if (noteData && noteData.notes) {
                                        const mdpsnt = document.getElementById('mod-post-note');
                                        mdpsnt.value = noteData.notes;
                                    } else {
                                        console.log("No data received from server, the note is probably blank");
                                    }
                                })
                                .catch(error => {
                                    console.error("Error loading note data:", error);
                                });

                        } else {
                            console.error("Error: No user data received from server.");
                        }
                    })
                    .catch(error => {
                        console.error("Error loading user data:", error);
                    });
            } else {
                console.error("Error: No data received from server.");
            }
        })
        .catch(error => {
            console.error("Error loading post:", error);
        });
}

async function modDeletePost(postid) {
    try {
        const response = await fetch(`https://api.meower.org/admin/posts/${postid}`, {
            method: "DELETE",
            headers: {
                "token": localStorage.getItem("token")
            }
        });

        if (response.ok) {
            console.log(`Post with ID ${postid} deleted successfully.`);
        } else {
            console.error(`Error deleting post with ID ${postid}: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error deleting post:", error);
    }
}

function updateNote(postid) {
    const note = document.getElementById('mod-post-note').value;

    fetch(`https://api.meower.org/admin/notes/${postid}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "token": localStorage.getItem("token")
        },
        body: JSON.stringify({
            notes: note
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log("Note updated successfully:", data);
        })
        .catch(error => {
            console.error("Error updating note:", error);
        });
}

function sendAlert(userid) {
    const note = document.getElementById('mod-user-alert').value;

    fetch(`https://api.meower.org/admin/users/${userid}/alert`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "token": localStorage.getItem("token")
        },
        body: JSON.stringify({
            content: note
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log("Alerted successfully:", data);
        })
        .catch(error => {
            console.error("Error sending alert:", error);
        });
}

function closeReport(postid, action) {
    if (action) {
        fetch(`https://api.meower.org/admin/reports/${postid}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "token": localStorage.getItem("token")
            },
            body: JSON.stringify({
                status: "action_taken"
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log("Report updated successfully:", data);
            })
            .catch(error => {
                console.error("Error updating report:", error);
            });
    } else {
        fetch(`https://api.meower.org/admin/reports/${postid}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "token": localStorage.getItem("token")
            },
            body: JSON.stringify({
                status: "no_action_taken"
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log("Report updated successfully:", data);
            })
            .catch(error => {
                console.error("Error updating report:", error);
            });
    }
}

function openUpdate(message) {
    document.documentElement.style.overflow = "hidden";

    const mdlbck = document.querySelector('.modal-back');
    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.modal');
        mdl.id = 'mdl-uptd';
        if (mdl) {
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                <h3>${message}</h3>
                `;
            }
            const mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = ``;
            }
        }
    }
}

function createChatModal() {
    document.documentElement.style.overflow = "hidden";

    const mdlbck = document.querySelector('.modal-back');
    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.modal');
        mdl.id = 'mdl-uptd';
        if (mdl) {
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                <h3>Create Chat</h3>
                <input id="chat-nick-input" class="mdl-inp" placeholder="nickname" minlength="1" maxlength="20">
                `;
            }
            const mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = `
                <button class="modal-back-btn" onclick="createChat()">create</button>
                `;
            }
        }
    }
}

function imagemodal() {
    document.documentElement.style.overflow = "hidden";

    const mdlbck = document.querySelector('.modal-back');
    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.modal');
        mdl.id = 'mdl-uptd';
        if (mdl) {
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                <h3>Background Image Link</h3>
                <input id="bg-image-input" class="mdl-inp" placeholder="https://512pixels.net/downloads/macos-wallpapers/10-3.png">
                `;
            }
            const mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = `
                <button class="modal-back-btn" onclick="updateBG()">update</button>
                `;
            }
        }
    }
}

function loadBG() {
    const bgImageURL = localStorage.getItem('backgroundImageURL');
    console.log(bgImageURL)
    if (bgImageURL) {
        const lightThemeBody = document.querySelector('.glight-theme body');
        if (lightThemeBody) {
            lightThemeBody.style.backgroundImage = `url('${bgImageURL}')`;
        }

        const darkThemeBody = document.querySelector('.gdark-theme body');
        if (darkThemeBody) {
            darkThemeBody.style.backgroundImage = `url('${bgImageURL}')`;
        }
    }
}

function updateBG() {
    const bgImageInput = document.getElementById('bg-image-input');
    if (bgImageInput) {
        const bgImageURL = bgImageInput.value;

        localStorage.setItem('backgroundImageURL', bgImageURL);

        const lightThemeBody = document.querySelector('.glight-theme body');
        if (lightThemeBody) {
            lightThemeBody.style.backgroundImage = `url('${bgImageURL}')`;
        }

        const darkThemeBody = document.querySelector('.gdark-theme body');
        if (darkThemeBody) {
            darkThemeBody.style.backgroundImage = `url('${bgImageURL}')`;
        }
    }
    closemodal();
}

// credit: theotherhades
function ipBlockedModal() {
    console.log("Showing IP blocked modal");
    document.documentElement.style.overflow = "hidden";

    let modalback = document.querySelector(".modal-back");

    if (modalback) {
        modalback.style.display = "flex";

        let modal = modalback.querySelector(".modal");
        if (modal) {
            let modaltop = modal.querySelector(".modal-top");
            if (modaltop) {
                modaltop.innerHTML = `
                <h3>IP Blocked</h3>
                <hr class="mdl-hr">
                <span class="subheader">Your current IP address is blocked from accessing Meower.<br /><br />If you think this is a mistake, please contact the moderation team via <a href="${communityDiscordLink}" target="_blank">Discord</a> or email us <a href="${forumLink}" target="_blank">${forumLink}</a>, or try a different network.</span>
                `
            }
        }
        const mdbt = modalback.querySelector('.modal-bottom');
        if (mdbt) {
            mdbt.innerHTML = ``;
        }
    }
}

document.addEventListener('click', function (event) {
    const modalButton = event.target.closest('.modal-button');
    const modal = event.target.closest('.modal');
    const isInsideModal = modal && modal.contains(event.target);

    if (modalButton && !isInsideModal) {
        event.stopPropagation();
    }
});

function mdlreply(event) {
    const modalId = event.target.closest('.modal').id;
    const postContainer = document.getElementById(modalId);

    if (postContainer) {
        const username = postContainer.querySelector('#username').innerText;
        const postContent = postContainer.querySelector('p').innerText
            .replace(/\n/g, ' ')
            .replace(/@\w+/g, '')
            .split(' ')
            .slice(0, 6)
            .join(' ');

        const postId = postContainer.id;
        document.getElementById('msg').value = `@${username} "${postContent}..." (${postId})\n`;
        document.getElementById('msg').focus();
        autoresize();
    }

    closemodal();
}

function mdlpingusr(event) {
    const modalId = event.target.closest('.modal').id;
    const postContainer = document.getElementById(modalId);

    if (postContainer) {
        const username = postContainer.querySelector('#username').innerText;
        document.getElementById('msg').value = `@${username} `;
        document.getElementById('msg').focus();
        autoresize();
    }

    closemodal();
}

function mdlshare(event) {
    const postId = event.target.closest('.modal').id;
    window.open(`https://meo-32r.pages.dev/share?id=${postId}`, '_blank');
    closemodal();
}

function loadexplore() {
    page = "explore";
    pre = "explore";
    document.getElementById("main").innerHTML = `
    <div class="explore">
    <h1>Explore</h1>
    <h3>Open User</h3>
    <form class="section-form" onsubmit="gotousr();">
        <input type="text" class="section-input" id="usrinp" placeholder="MikeDEV">
        <button class="section-send button">Go!</button>
    </form>
    <h3>Statistics</h3>
    <div class="section stats">
    </div>
    </div>
    `;

    loadstats();

}

function gotousr() {
    event.preventDefault();
    openUsrModal(document.getElementById("usrinp").value);
    document.getElementById("usrinp").blur();
}

function modgotousr() {
    event.preventDefault();
    modUserModal(document.getElementById("usrinpmd").value);
}

async function loadstats() {
    try {
        const response = await fetch('https://api.meower.org/statistics');
        const data = await response.json();

        const formattedData = {
            chats: formatNumber(data.chats),
            posts: formatNumber(data.posts),
            users: formatNumber(data.users)
        };

        const statsDiv = document.querySelector('.stats');
        statsDiv.innerHTML = `
            <p>There are ${formattedData.chats} chats, ${formattedData.posts} posts, ${formattedData.users} users and counting!</p>
        `;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function formatNumber(number) {
    if (number >= 1e6) {
        return (number / 1e6).toFixed(1) + 'm';
    } else if (number >= 1e3) {
        return (number / 1e3).toFixed(1) + 'k';
    } else {
        return number.toString();
    }
}

function darkenColour(hex, amount) {
    hex = hex.replace(/^#/, '');

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    const nr = Math.max(0, r) / amount;
    const ng = Math.max(0, g) / amount;
    const nb = Math.max(0, b) / amount;

    const nh = `#${(nr << 16 | ng << 8 | nb).toString(16).padStart(6, '0')}`;

    return nh;
}

function lightenColour(hex, amount) {
    hex = hex.replace(/^#/, '');

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    const nr = Math.min(255, r + (255 - r) / amount);
    const ng = Math.min(255, g + (255 - g) / amount);
    const nb = Math.min(255, b + (255 - b) / amount);

    const nh = `#${(nr << 16 | ng << 8 | nb).toString(16).padStart(6, '0')}`;

    return nh;
}

function createDate(tsmp) {
    const tsr = tsmp;
    tsra = tsr * 1000;
    tsrb = Math.trunc(tsra);
    const ts = new Date();
    ts.setTime(tsrb);
    return new Date(tsrb).toLocaleString([], { month: '2-digit', day: '2-digit', year: '2-digit', hour: 'numeric', minute: 'numeric' });
}

function uploadImage() {
    uploadModal()
}

function goAnywhere() {
    document.documentElement.style.overflow = "hidden";

    const mdlbck = document.querySelector('.modal-back');
    if (mdlbck) {
        mdlbck.style.display = 'flex';

        const mdl = mdlbck.querySelector('.modal');
        mdl.id = 'mdl-qkshr';
        if (mdl) {
            const mdlt = mdl.querySelector('.modal-top');
            if (mdlt) {
                mdlt.innerHTML = `
                    <form class="section-form" onsubmit="goTo();">
                        <input type="text" id="goanywhere" class="big-mdl-inp" placeholder="Where would you like to go?" autocomplete="off">
                    </form>
                    <div class="search-population">
                        <div class="searchitem">Search for anything!</div>
                        <div class="searchitem">Use <span id="scil" title="Profile"> !</span><span id="scil" title="DM"> @</span><span id="scil" title="Chat"> #</span> for something specific.</div>            
                    </div>
                `;
                const goanywhereInput = mdlt.querySelector('#goanywhere');
                goanywhereInput.addEventListener('input', populateSearch);
            }
            const mdbt = mdl.querySelector('.modal-bottom');
            if (mdbt) {
                mdbt.innerHTML = `
                <button class="modal-back-btn" onclick="goTo()">go!</button>
                `;
            }
        }
    }
    if (window.innerWidth >= 480) {
        document.getElementById("goanywhere").focus();
    }
}

function goTo() {
    event.preventDefault();
    const place = document.getElementById("goanywhere").value;
    closemodal();
    if (place.charAt(0) === "#") {
        const nickname = place.substring(1);
        const chatId = searchChats(nickname);
        if (chatId) {
            loadchat(chatId);
        }
    } else if (place.charAt(0) === "@") {
        opendm(place.substring(1));
    } else if (place.charAt(0) === "!") {
        openUsrModal(place.substring(1));
    } else if (place === "home") {
        loadhome();
    } else if (place === "start") {
        loadstart();
    } else if (place === "settings") {
        loadstgs();
        loadgeneral();
    } else if (place === "general") {
        loadstgs();
        loadgeneral();
    } else if (place === "appearance") {
        loadstgs();
        loadappearance();
    } else if (place === "plugins") {
        loadstgs();
        loadplugins();
    } else if (place === "explore") {
        loadexplore();
    } else if (place === "inbox") {
        loadinbox();
    }
}

function searchChats(nickname) {
    for (const chatId in chatCache) {
        if (chatCache.hasOwnProperty(chatId)) {
            const chat = chatCache[chatId];
            if (chat.nickname) {
                if (chat.nickname.toLowerCase() === nickname.toLowerCase()) {
                    return chat._id;
                }
            }
        }
    }
    return null;
}


function populateSearch() {
    const query = document.getElementById("goanywhere").value.toLowerCase();
    const searchPopulation = document.querySelector('.search-population');
    if (query !== '') {
        searchPopulation.innerHTML = '';
        const usernames = Object.keys(pfpCache).filter(username => username.toLowerCase().includes(query));
        const groupChats = Object.values(chatCache).filter(chat => chat.nickname && chat.nickname.toLowerCase().includes(query));
        usernames.forEach(username => {
            const item = document.createElement('div');
            item.innerText = '@' + username
            item.classList.add('searchitem');
            item.id = 'srchuser';
            item.onclick = function () {
                opendm(username);
                closemodal();
            };
            searchPopulation.appendChild(item);
        });

        groupChats.forEach(chat => {
            const item = document.createElement('div');
            item.innerText = chat.nickname
            item.classList.add('searchitem');
            item.id = 'srchchat';
            item.onclick = function () {
                loadchat(chat._id);
                closemodal();
            };
            searchPopulation.appendChild(item);
        });
    } else {
        searchPopulation.innerHTML = `
        <div class="searchitem">Search for anything!</div>
        <div class="searchitem">Use <span id="scil" title="Profile"> !</span><span id="scil" title="DM"> @</span><span id="scil" title="Chat"> #</span> for something specific.</div>
        `;
    }
}

main();
setInterval(ping, 5000);