// window.Typerefinery.Components.Structure.Sidebar = {
//     getData: function () {
//         let data = {
//         };
//         document.querySelectorAll('[data-module="vue-sidebar"]').forEach(async (_,index) => {
//             // unique name
//             let modelName = `sideBarNodes${index}`;
//             data[modelName] =  [
//                 {
//                     "key": "dashboardPage",
//                     "label": "Dashboard",
//                     "data": "Dashboard",
//                     "icon": "pi pi-qrcode",
//                     "url": "dashboard.html"
//                 },
//                 {
//                     "key": "searchPage",
//                     "label": "Search",
//                     "data": "Search",
//                     "icon": "pi pi-search",
//                     "url": "search.html"
//                 },
//                 {
//                     "key": "activitiesPage",
//                     "label": "Activities",
//                     "data": "Activities",
//                     "icon": "pi pi-fw pi-calendar",
//                     "children": [
//                         {
//                             "key": "feedsPage",
//                             "label": "Feeds",
//                             "icon": "pi pi-fw pi-calendar-plus",
//                             "data": "Feeds",
//                             "url": "feeds.html"
//                         },
//                         {
//                             "key": "trendsPage",
//                             "label": "Trends",
//                             "icon": "pi pi-fw pi-calendar-plus",
//                             "data": "Trends",
//                             "url": "trends.html"
//                         }
//                     ]
//                 },
//                 {
//                     "key": "bookmarksPage",
//                     "label": "Bookmarks",
//                     "data": "Bookmarks",
//                     "icon": "pi pi-bookmark",
//                     "url": "bookmarks.html"
//                 }
//             ];
//             data["sideBarRoutes"] = {
//                 "Dashboard": "dashboard.html",
//                 "Feeds": "feeds.html",
//                 "Trends": "trends.html",
//                 "Bookmarks": "bookmarks.html",
//                 "Search": "search.html"
//             };
//             _.setAttribute(":value", modelName);
//         });
//         return data;
//     }
// }