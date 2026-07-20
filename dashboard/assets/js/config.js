const SIGNAL13 = {

    dashboard: window.location.pathname || "/",

    stageTimer: "/stagetimer",

    backstage: "/backstage",

    timeline: "/timeline",

    studio: "/studio",

    editor: "/editor/",

    rundown: ""

};

window.SIGNAL13 = SIGNAL13;

function getLink(path){
    return window.location.origin + path;
}
