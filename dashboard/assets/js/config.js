const SIGNAL13 = {

    dashboard: "/dashboard/",

    stageTimer: "/timer/",

    backstage: "/backstage/",

    timeline: "/timeline/",


    editor: "/editor/",

    studio: "/studio/",

    health: "/health",

    apiStatus: "/api/status",

    rundown: "",

    instagram: "https://instagram.com/semestaonstage"

};

window.SIGNAL13 = SIGNAL13;

function getLink(path){
    return window.location.origin + path;
}
