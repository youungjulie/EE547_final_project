$(document).ready(() => {
    // load posts when page loads
    $.get("/api/posts", results => {
        outputPosts(results, $(".postsContainer"));
    })
})
