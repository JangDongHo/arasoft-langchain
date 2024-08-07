
// nac_layerlist_tab.js

$(function () {
    if (typeof Setter !== typeof undefined)
        return;

    NacLLTab.initEvent();
    NacLLTab.initSize();
    NacLLTab.initMedia();
});

var NacLLTab = {};

NacLLTab.scroller = {};
NacLLTab.scroller.down = false;
NacLLTab.scroller.moving = false;
NacLLTab.scroller.target = null;
NacLLTab.scroller.downPosition = 0;
NacLLTab.scroller.scrollPosition = 0;
NacLLTab.animating = false;

NacLLTab.initEvent = function () {
    var tab = $(".nac_layerlist_tab");
    tab.each(function () {
        var node = $(this);
        var thumbs = NacLLTab.thumbs(node);
        var thumbContainer = NacLLTab.thumbsContainerElement(node);
        thumbs.on("click", NacLLTab.onThumb);
        thumbContainer.on("mousedown", NacLLTab.onMouseDown);
        thumbContainer.on("touchstart", NacLLTab.onTouchStart);
        $(window).resize(function () {
            NacLLTab.setItemSize(node);
        });
    });
    tab.on("show", NacLLTab.onShow);

    $(document).on("mousemove", NacLLTab.onMouseMove);
    $(document).on("mouseup", NacLLTab.onMouseUp);
    $(document).on("mouseleave", NacLLTab.onMouseUp);
    $(document).on("touchmove", NacLLTab.onTouchMove);
    $(document).on("touchend", NacLLTab.onTouchEnd);
}

NacLLTab.initSize = function () {
    var tab = $(".nac_layerlist_tab");
    tab.each(function () {
        var node = $(this);
        NacLLTab.setItemSize(node);
    });
}

NacLLTab.initMedia = function () {
    var toggle = $(".nac_layerlist_tab");
    toggle.find(".nac_item:not(.nac_active) audio, .nac_item:not(.nac_active) video").each(function () { this.pause(); });
    toggle.each(function () { NacLLTab.playMediaIfAutoPlay(NacLLTab.activeItem($(this))); });
}

NacLLTab.isVisible = function (node) {
    return node[0].offsetWidth > 0 || node[0].offsetHeight > 0;
}

NacLLTab.playMediaIfAutoPlay = function (item) {
    if (!NacLLTab.isVisible(item))
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

NacLLTab.selectionChanged = function (tab, currentItem, newItem) {
    currentItem.find("audio, video").each(function () { this.pause(); });
    newItem.find(".nac_media, .nac_layerlist").trigger("show");
    NacLLTab.playMediaIfAutoPlay(newItem);

    var items = NacLLTab.items(tab);
    tab.trigger("pageChanged", [items.length, items.index(currentItem[0]), items.index(newItem[0])]);
}

NacLLTab.parentLayerListTabElement = function (child) {
    var cur = child.parent();
    while (cur.length > 0) {
        if (cur.hasClass("nac_layerlist_tab"))
            return cur;
        cur = cur.parent();
    }
    return null;
}

NacLLTab.itemsContainerElement = function (tab) {
    return tab.children(".nac_content_container");
}

NacLLTab.items = function (tab) {
    return NacLLTab.itemsContainerElement(tab).children(".nac_item");
}

NacLLTab.activeItem = function (tab) {
    return NacLLTab.itemsContainerElement(tab).children(".nac_item.nac_active");
}

NacLLTab.thumbsContainerElement = function (tab) {
    return tab.children(".nac_thumb_container");
}

NacLLTab.thumbs = function (tab) {
    return NacLLTab.thumbsContainerElement(tab).children(".nac_thumb");
}

NacLLTab.activeThumb = function (tab) {
    return NacLLTab.thumbsContainerElement(tab).children(".nac_thumb.nac_active");
}

NacLLTab.setItemSize = function (tab) {
    var items = NacLLTab.items(tab).css("position", "absolute");
    var container = NacLLTab.itemsContainerElement(tab);
    var paddingLeft = parseInt(container.css("padding-left"), 10);
    var paddingTop = parseInt(container.css("padding-top"), 10);
    var paddingRight = parseInt(container.css("padding-right"), 10);
    var paddingBottom = parseInt(container.css("padding-bottom"), 10);
    var borderLeft = parseInt(container.css("border-left"), 10);
    var borderTop = parseInt(container.css("border-top"), 10);
    var borderRight = parseInt(container.css("border-right"), 10);
    var borderBottom = parseInt(container.css("border-bottom"), 10);
    var containerWidth = parseInt(container.css("width"), 10);
    var containerHeight = parseInt(container.css("height"), 10);

    var left = paddingLeft;
    var top = paddingTop;
    var width = containerWidth - borderLeft - borderRight - paddingLeft - paddingRight;
    var height = containerHeight - borderTop - borderBottom - paddingTop - paddingBottom;

    items.css({
        "left": left + "px",
        "top": top + "px",
        "width": width + "px",
        "height": height + "px"
    });
}

NacLLTab.selectByThumb = function (thumb) {
    if (thumb.hasClass("nac_active"))
        return;

    var tab = NacLLTab.parentLayerListTabElement(thumb);
    var thumbs = NacLLTab.thumbs(tab);
    var index = thumbs.index(thumb[0]);
    thumbs.removeClass("nac_active");
    thumb.addClass("nac_active");

    var items = NacLLTab.items(tab);
    var currentItem = NacLLTab.activeItem(tab);
    var newItem = items.eq(index);
    newItem.removeClass("nac_display_none");
    NacLLTab.selectionChanged(tab, currentItem, newItem);

    NacLLTab.animating = true;
    currentItem.animate({ "opacity": "0" }, 200, function () {
        currentItem.removeClass("nac_active").addClass("nac_display_none");
    });
    newItem.animate({ "opacity": "1" }, 200, function () {
        newItem.addClass("nac_active");
        NacLLTab.animating = false;
    });

    var scrollOffset = 0;
    var left = thumb.position().left;
    var width = thumb.width() + parseInt(thumb.css("margin-left")) + parseInt(thumb.css("margin-right"));
    var container = NacLLTab.thumbsContainerElement(tab);
    var containerWidth = container.width();
    if (left < 0 || width > containerWidth)
        scrollOffset = left;
    else if (left + width > containerWidth)
        scrollOffset = left + width - containerWidth;

    if (scrollOffset != 0)
        container.animate({ "scrollLeft": container[0].scrollLeft + scrollOffset }, 200);
}

NacLLTab.onThumb = function () {
    if (!NacLLTab.scroller.moving && !NacLLTab.animating)
        NacLLTab.selectByThumb($(this));
}

NacLLTab.onShow = function (event) {
    if (event.target == this) {
        NacLLTab.setItemSize($(this));
        NacLLTab.playMediaIfAutoPlay(NacLLTab.activeItem($(this)));
    }
    event.stopPropagation();
}

NacLLTab.prevent = function (event) {
    event.stopPropagation();
    event.preventDefault();
}

NacLLTab.onTouchStart = function (event) {
    var touches = event.originalEvent.touches;
    if (!touches || touches.length != 1) {
        NacLLTab.handleUp();
        return;
    }

    if (NacLLTab.handleDown(NacLLTab.parentLayerListTabElement($(this)), touches[0].clientX))
        NacLLTab.prevent(event);
}

NacLLTab.onTouchMove = function (event) {
    var touches = event.originalEvent.changedTouches;
    if (!touches || touches.length != 1) {
        NacLLTab.handleUp();
        return;
    }

    if (NacLLTab.handleMove(touches[0].clientX, 30))
        NacLLTab.prevent(event);
}

NacLLTab.onTouchEnd = function (event) {
    if (NacLLTab.handleUp())
        NacLLTab.prevent(event);
}

NacLLTab.onMouseDown = function (event) {
    if (NacLLTab.handleDown(NacLLTab.parentLayerListTabElement($(this)), event.clientX))
        NacLLTab.prevent(event);
}

NacLLTab.onMouseMove = function (event) {
    if (NacLLTab.handleMove(event.clientX, 5))
        NacLLTab.prevent(event);
}

NacLLTab.onMouseUp = function (event) {
    if (NacLLTab.handleUp())
        NacLLTab.prevent(event);
}

NacLLTab.handleDown = function (tab, x) {
    var container = NacLLTab.thumbsContainerElement(tab)[0];
    if (container.clientWidth >= container.scrollWidth)
        return false;

    NacLLTab.scroller.down = true;
    NacLLTab.scroller.downPosition = x;
    NacLLTab.scroller.target = container;
    NacLLTab.scroller.scrollPosition = NacLLTab.scroller.target.scrollLeft;
    return true;
}

NacLLTab.handleMove = function (x, gap) {
    if (!NacLLTab.scroller.down)
        return false;

    var offset = NacLLTab.scroller.downPosition - x;
    if (!NacLLTab.scroller.moving && Math.abs(offset) < gap)
        return false;

    if (!NacLLTab.scroller.moving) {
        $(NacLLTab.scroller.target).addClass("nac_thin_scroll");
        NacLLTab.scroller.moving = true;
    }

    NacLLTab.scroller.target.scrollLeft = NacLLTab.scroller.scrollPosition + offset;
    return true;
}

NacLLTab.handleUp = function () {
    if (!NacLLTab.scroller.down)
        return false;

    NacLLTab.scroller.down = false;
    $(NacLLTab.scroller.target).removeClass("nac_thin_scroll");
    setTimeout(function () {
        NacLLTab.scroller.moving = false;
    }, 1);
    return true;
}




