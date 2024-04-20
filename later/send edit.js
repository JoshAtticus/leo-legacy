    try {
        const response = await fetch(`https://api.meower.org/posts?id=${postid}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "token": localStorage.getItem("token")
            },
            body: JSON.stringify({ content })
        });
    
        if (response.ok) {
            console.log(`Post with ID ${postid} edited successfully.`);
        } else {
            console.error(`Error editing post with ID ${postid}: ${response.status} - ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error editing post:", error);
    }