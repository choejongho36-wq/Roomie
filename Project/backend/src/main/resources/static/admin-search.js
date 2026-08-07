// Roomie 관리자 페이지 상단 통합검색.
// 지금은 관리 "기능"(페이지) 목록만 검색하지만, 나중에 항목이 늘어나도
// 이 배열에 추가만 하면 되도록 만들어뒀다.
(function () {
    var ADMIN_MENU_ITEMS = [
        { label: "Dashboard", url: "/admin" },
        { label: "회원 관리", url: "/admin/users" },
        { label: "게시글 관리", url: "/admin/posts" },
        { label: "공지/이벤트 새 글쓰기", url: "/admin/posts/write" },
        { label: "문의 관리", url: "/admin/inquiries" },
        { label: "게시글 고정 관리", url: "/admin/notices" },
    ];

    document.addEventListener("DOMContentLoaded", function () {
        var input = document.getElementById("adminSearchInput");
        var resultsBox = document.getElementById("adminSearchResults");
        var searchBtn = document.getElementById("btnNavbarSearch");
        if (!input || !resultsBox) return;

        function close() {
            resultsBox.classList.remove("is-open");
            resultsBox.innerHTML = "";
        }

        function render(keyword) {
            resultsBox.innerHTML = "";
            if (!keyword) {
                close();
                return;
            }
            var matches = ADMIN_MENU_ITEMS.filter(function (item) {
                return item.label.toLowerCase().indexOf(keyword.toLowerCase()) !== -1;
            });
            if (matches.length === 0) {
                var empty = document.createElement("div");
                empty.className = "admin-search-empty";
                empty.textContent = "일치하는 기능이 없어요.";
                resultsBox.appendChild(empty);
            } else {
                matches.forEach(function (item) {
                    var link = document.createElement("a");
                    link.href = item.url;
                    link.className = "admin-search-item";
                    link.textContent = item.label;
                    resultsBox.appendChild(link);
                });
            }
            resultsBox.classList.add("is-open");
        }

        input.addEventListener("input", function () {
            render(input.value.trim());
        });

        input.addEventListener("focus", function () {
            render(input.value.trim());
        });

        input.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                var first = resultsBox.querySelector(".admin-search-item");
                if (first) window.location.href = first.getAttribute("href");
            } else if (e.key === "Escape") {
                close();
            }
        });

        if (searchBtn) {
            searchBtn.addEventListener("click", function () {
                var first = resultsBox.querySelector(".admin-search-item");
                if (first) window.location.href = first.getAttribute("href");
            });
        }

        document.addEventListener("click", function (e) {
            if (e.target !== input && !resultsBox.contains(e.target)) {
                close();
            }
        });
    });
})();
