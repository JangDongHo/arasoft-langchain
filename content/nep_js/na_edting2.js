// na_edting.js

// question component
var NacdQuestion = {};
NacdQuestion.showHintForEditor = function () {
    var question = $(document.editingElement);
    question.find(".hint").css({ "opacity": "1", "z-index": "3" });
    question.find(".explain").css({ "opacity": "0", "z-index": "-1" });
}
NacdQuestion.showExplainForEditor = function () {
    var question = $(document.editingElement);
    question.find(".hint").css({ "opacity": "0", "z-index": "-1" });
    question.find(".explain").css({ "opacity": "1", "z-index": "3" });
}
NacdQuestion.hideHintAndExplainForEditor = function () {
    var question = $(document.editingElement);
    question.find(".hint").css({ "opacity": "0", "z-index": "-1" });
    question.find(".explain").css({ "opacity": "0", "z-index": "-1" });
}



