
// nac_layerlist_arccodion.js

$(function () {
    if (typeof Setter !== typeof undefined)
        return;

    NacLLArccodion.initEvent();
    NacLLArccodion.initMedia();
});

var NacLLArccodion = {};

NacLLArccodion.animating = false;

NacLLArccodion.initEvent = function () {
    var arccodion = $(".nac_layerlist_arccodion");
    arccodion.each(function () {
        var node = $(this);
        var thumbs = NacLLArccodion.thumbs(node);
        thumbs.on("click", NacLLArccodion.onThumb);
    });
    arccodion.on("show", NacLLArccodion.onShow);
}

NacLLArccodion.initMedia = function () {
    var arccodion = $(".nac_layerlist_arccodion");
    arccodion.find(".nac_item:not(.nac_active) audio, .nac_item:not(.nac_active) video").each(function () { this.pause(); });
    arccodion.each(function () { NacLLArccodion.playMediaIfAutoPlay(NacLLArccodion.activeItem($(this))); });
}

NacLLArccodion.isVisible = function (node) {
    return node[0].offsetWidth > 0 || node[0].offsetHeight > 0;
}

NacLLArccodion.playMediaIfAutoPlay = function (item) {
    if (!NacLLArccodion.isVisible(item))
        return;

    item.find("audio[autoplay], video[autoplay]").each(function () {
        var parent = this.parentNode;
        while (parent != item[0]) {
            if ($(parent).hasClass("nac_layerlist"))
                return;
            parent = parent.parentNode;
        }
        this.play();
    });
}

NacLLArccodion.selectionChanged = function (arccodion, currentItem, newItem) {
    currentItem.find("audio, video").each(function () { this.pause(); });
    newItem.find(".nac_media, .nac_layerlist").trigger("show");
    NacLLArccodion.playMediaIfAutoPlay(newItem);

    var items = NacLLArccodion.items(arccodion);
    arccodion.trigger("pageChanged", [items.length, items.index(currentItem[0]), items.index(newItem[0])]);
}

NacLLArccodion.parentLayerListArccodionElement = function (child) {
    var cur = child.parent();
    while (cur.length > 0) {
        if (cur.hasClass("nac_layerlist_arccodion"))
            return cur;
        cur = cur.parent();
    }
    return null;
}

NacLLArccodion.items = function (arccodion) {
    return arccodion.children(".nac_item");
}

NacLLArccodion.activeItem = function (arccodion) {
    return arccodion.children(".nac_item.nac_active");
}

NacLLArccodion.thumbs = function (arccodion) {
    return arccodion.children(".nac_thumb");
}

NacLLArccodion.activeThumb = function (arccodion) {
    return arccodion.children(".nac_thumb.nac_active");
}

NacLLArccodion.selectByThumb = function (thumb) {
    if (thumb.hasClass("nac_active"))
        return;

    var arccodion = NacLLArccodion.parentLayerListArccodionElement(thumb);
    var currentThumb = NacLLArccodion.activeThumb(arccodion);
    var currentItem = currentThumb.next(".nac_item");
    var newItem = thumb.next(".nac_item");
    
    currentThumb.removeClass("nac_active");
    thumb.addClass("nac_active");

    if (arccodion.hasClass("nac_horz")) {
        var value = currentItem.css("width");
        currentItem.css({
            "width": value,
            "flex-grow": "0",
        });
        newItem.css({
            "width": "0px",
            "flex-grow": "0",
        });
        newItem.removeClass("nac_display_none");

        NacLLArccodion.animating = true;
        currentItem.animate({ "width": "0px" }, 200, function () {
            currentItem.removeClass("nac_active").addClass("nac_display_none");
            currentItem.css("flex-grow", "");
            currentItem.css("width", "");
        });
        newItem.animate({ "width": value }, 200, function () {
            newItem.addClass("nac_active");
            newItem.css("flex-grow", "");
            newItem.css("width", "");
            NacLLArccodion.selectionChanged(arccodion, currentItem, newItem);
            NacLLArccodion.animating = false;
        });
    }
    else {
        var value = currentItem.css("height");
        currentItem.css({
            "height": value,
            "flex-grow": "0",
        });
        newItem.css({
            "height": "0px",
            "flex-grow": "0",
        });
        newItem.removeClass("nac_display_none");

        NacLLArccodion.animating = true;
        currentItem.animate({ "height": "0px" }, 200, function () {
            currentItem.removeClass("nac_active").addClass("nac_display_none");
            currentItem.css("flex-grow", "");
            currentItem.css("height", "");
        });
        newItem.animate({ "height": value }, 200, function () {
            newItem.addClass("nac_active");
            newItem.css("flex-grow", "");
            newItem.css("height", "");
            NacLLArccodion.selectionChanged(arccodion, currentItem, newItem);
            NacLLArccodion.animating = false;
        });
    }
}

NacLLArccodion.onThumb = function () {
    if (!NacLLArccodion.animating)
        NacLLArccodion.selectByThumb($(this));
}

NacLLArccodion.onShow = function (event) {
    if (event.target == this)
        NacLLArccodion.playMediaIfAutoPlay(NacLLArccodion.activeItem($(this)));
    event.stopPropagation();
}





