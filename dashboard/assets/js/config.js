const SIGNAL13 = {

    stageTimer: "/stagetimer",

    backstage: "/backstage",

    timeline: "/timeline",

    studio: "/studio",

    rundown: ""

};

window.SIGNAL13 = SIGNAL13;

function getLink(path){
    return window.location.origin + path;
}
