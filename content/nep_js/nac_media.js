
// nac_media.js

$(function () {
    if (typeof Setter !== typeof undefined)
        return;

    // avoid simultaneous playback
    $("video, audio").on("play", function (event) {
        $("video, audio").each(function () {
            if (event.target != this)
                this.pause();
        });
    });
    
    var media = $(".nac_media");
    NacMedia.initMedia(media);

    media.find("img").attr("draggable", "false");
    media.find(".nac_mute").addClass("nac_display_none");
    media.find(".nac_shuffle_off").addClass("nac_display_none");

    media.on("show", NacMedia.onShow);
    media.find(".nac_play").on("click", NacMedia.onPlay);
    media.find(".nac_pause").on("click", NacMedia.onPause);
    media.find(".nac_video_container").on("click", NacMedia.onVideoContainerClick);
    media.find(".nac_volume").on("click", NacMedia.onVolume);
    media.find(".nac_mute").on("click", NacMedia.onMute);
    media.find(".nac_fullscreen").on("click", NacMedia.onFullScreen);
    media.find(".nac_list").on("click", NacMedia.onList);
    media.find(".nac_first").on("click", NacMedia.onFirst);
    media.find(".nac_last").on("click", NacMedia.onLast);
    media.find(".nac_prev").on("click", NacMedia.onPrev);
    media.find(".nac_next").on("click", NacMedia.onNext);
    media.find(".nac_shuffle_on").on("click", NacMedia.onShuffleOn);
    media.find(".nac_shuffle_off").on("click", NacMedia.onShuffleOff);
    media.find(".nac_item").on("click", NacMedia.onPlayItem);
    media.find(".nac_player").on("ended", NacMedia.onEnded);

    media.find(".nac_current_time").on("mousedown", NacMedia.onMouseDownTime);
    media.find(".nac_current_volume").on("mousedown", NacMedia.onMouseDownVolume);
    media.find(".nac_current_simple_time").on("mousedown", NacMedia.onMouseDownSimpleTime);
    media.find(".nac_items").on("mousedown", NacMedia.onMouseDownItems);
    $(document).on("mousemove", NacMedia.onMouseMove);
    $(document).on("mouseup", NacMedia.onMouseUp);
    $(document).on("mouseleave", NacMedia.onMouseUp);

    media.find(".nac_current_time").on("touchstart", NacMedia.onTouchTime);
    media.find(".nac_current_volume").on("touchstart", NacMedia.onTouchVolume);
    media.find(".nac_current_simple_time").on("touchstart", NacMedia.onTouchSimpleTime);
    media.find(".nac_items").on("touchstart", NacMedia.onTouchItems);
    $(document).on("touchmove", NacMedia.onTouchMove);
    $(document).on("touchend", NacMedia.onTouchEnd);

    media.each(function () {
        var node = $(this);
        NacMedia.initPlayer(node);
        NacMedia.createVideoButton(node);
        NacMedia.autoPlay(node);

        if (node.hasClass("nac_audio_button")) {
            var play = node.find(".nac_play");
            var pause = node.find(".nac_pause");
            var value = window.getComputedStyle(play[0], null).getPropertyValue("width");
            pause.css("width", value);
            value = window.getComputedStyle(play[0], null).getPropertyValue("height");
            pause.css("height", value);
        }
        else {
            node.find(".nac_items").addClass("nac_thin_scroll");
            NacMedia.setThumbPosition(node.find(".nac_current_time"), 0);
            NacMedia.setThumbPosition(node.find(".nac_current_volume"), node.find(".nac_player")[0].volume);
        }
    });
    setInterval(NacMedia.updatePlayingAudioButton, 50);
    setInterval(NacMedia.updatePlayingMedia, 1000);
});

var NacMedia = {};

NacMedia.playingNodes = new Array();
NacMedia.pauseTimer = new Array();

NacMedia.scroller = {};
NacMedia.scroller.state = 0; // 0:none, 1:time, 2:volume, 3:audio button, 4:item scroll
NacMedia.scroller.moving = false;
NacMedia.scroller.target = null;
NacMedia.scroller.downPosition = 0;
NacMedia.scroller.horzScroll = false;
NacMedia.scroller.scrollPosition = 0;

NacMedia.mediaLoaded = function () {
    var media = NacMedia.parentMediaElement($(this));
    if (NacMedia.isVideo(media))
        NacMedia.initVideoSize(media);

    NacMedia.setThumbPosition(media.find(".nac_current_volume"), media.find(".nac_player")[0].volume);
    NacMedia.update(media);

    if (typeof NacHandler !== typeof undefined && typeof NacHandler.onMediaLoaded !== typeof undefined)
        NacHandler.onMediaLoaded(media);
}

NacMedia.mediaProgress = function (media, isPlaying, currentTime) {
    if (typeof NacHandler !== typeof undefined && typeof NacHandler.onMediaProgress !== typeof undefined)
        NacHandler.onMediaProgress(media, isPlaying, currentTime);
}

NacMedia.mediaEnded = function (media) {
    if (typeof NacHandler !== typeof undefined && typeof NacHandler.onMediaEnded !== typeof undefined)
        NacHandler.onMediaEnded(media);
}

NacMedia.mediaPlayed = function (media) {
    if (typeof NacHandler !== typeof undefined && typeof NacHandler.onMediaPlayed !== typeof undefined)
        NacHandler.onMediaPlayed(media);
}

NacMedia.mediaPaused = function (media) {
    if (typeof NacHandler !== typeof undefined && typeof NacHandler.onMediaPaused !== typeof undefined)
        NacHandler.onMediaPaused(media);
}

NacMedia.parentMediaElement = function (child) {
    var cur = child.parent();
    while (cur.length > 0) {
        if (cur.hasClass("nac_media"))
            return cur;
        cur = cur.parent();
    }
    return null;
}

NacMedia.isAudio = function (node) {
    return node.hasClass("nac_audio");
}

NacMedia.isVideo = function (node) {
    return node.hasClass("nac_video");
}

NacMedia.isVisible = function (node) {
    return node[0].offsetWidth > 0 || node[0].offsetHeight > 0;
}

NacMedia.replaceDummyVideoToWrapper = function (video) {
    video.find(".nac_mm_dummy").each(function () {
        var dummy = $(this);
        var poster = dummy.attr("poster");
        if (!poster)
            return;

        var url = "url(" + poster + ")";
        var style = dummy.attr("style");
        $(document.createElement("div")).addClass("nac_dummy_wrapper").attr("style", style).css("background-image", url).insertBefore(dummy);
        dummy.addClass("nac_display_none");
    });
}

NacMedia.initMedia = function (nodes) {
    nodes.each(function () {
        var media = $(this);
        media.find(NacMedia.isAudio(media) ? "audio" : "video").removeAttr("controls").removeAttr("autoplay").removeAttr("loop");
        var player = media.find(".nac_player");
        if (media.hasClass("nac_audio")) {
            var mediaHeight = media.outerHeight();
            var playListSize = media.find(".nac_play_list").outerHeight();
            media.attr("data-media-size", mediaHeight);
            media.attr("data-list-size", playListSize);
        }
        else if (media.hasClass("nac_video_horz")) {
            var playListSize = media.find(".nac_play_list").outerWidth();
            media.attr("data-list-size", playListSize);
            NacMedia.replaceDummyVideoToWrapper(media);
        }
        else if (media.hasClass("nac_video_vert")) {
            var playListSize = media.find(".nac_items").outerHeight();
            media.attr("data-list-size", playListSize);
            NacMedia.replaceDummyVideoToWrapper(media);
        }
        player[0].onloadeddata = NacMedia.mediaLoaded;
    });
}

NacMedia.initPlayer = function (node) {
    var player = node.find(".nac_player");
    player.on("play", NacMedia.handlePlay);
    player.on("pause", NacMedia.handlePause);

    var firstItem = $(node.find(".nac_item")[0]).addClass("nac_active");
    if (firstItem.length != 1)
        return;

    player.attr("src", firstItem.find(".nac_mm_dummy").attr("src"));
    if (NacMedia.isVideo(node))
        player.attr("poster", firstItem.find(".nac_mm_dummy").attr("poster"));

}

NacMedia.createVideoButton = function (node) {
    if (!NacMedia.isVideo(node))
        return;
    if (!node.hasClass("nac_click_play"))
        return;

    var videoContainer = node.find(".nac_video_container");
    var playSource = node.find(".nac_play_normal").css("background-image");
    var pauseSource = node.find(".nac_pause_normal").css("background-image");
    var playButton = $(document.createElement("div")).addClass("nac_play_button");
    var pauseButton = $(document.createElement("div")).addClass("nac_pause_button");
    playButton.css({ "background-image": playSource, "position": "absolute", "opacity": "1" });
    pauseButton.css({ "background-image": pauseSource, "position": "absolute" });
    videoContainer.append(playButton);
    videoContainer.append(pauseButton);
}

NacMedia.autoPlay = function (node) {
    if (NacMedia.isVisible(node) && node.hasClass("nac_auto"))
        NacMedia.play(node);
    else
        NacMedia.pause(node);
}

NacMedia.toggleList = function (media) {
    if (media.hasClass("nac_audio"))
        NacMedia.toggleAudioList(media);
    else if (media.hasClass("nac_video_horz"))
        NacMedia.toggleHorzVideoList(media);
    else if (media.hasClass("nac_video_vert"))
        NacMedia.toggleVertVideoList(media);
}

NacMedia.toggleAudioList = function (media) {
    var list = media.find(".nac_play_list");
    var items = list.find(".nac_items");
    var mediaSize = parseInt(media.attr("data-media-size"), 10);
    if (list.hasClass("nac_display_none")) {
        list.removeClass("nac_display_none");
        media.stop(true, true).animate({ "height": mediaSize + "px" }, 200);
    }
    else {
        var listSize = parseInt(media.attr("data-list-size"), 10);
        media.stop(true, true).animate({ "height": (mediaSize - listSize) + "px" }, 200, function () {
            list.addClass("nac_display_none");
        });
    }
}

// 엔진에서 제대로 렌더링하지 못하는 버그로...
NacMedia.canAnimateIfHorizontalVideo = function () {
    if (document.callEditor === undefined)
        return true;

    var meta = $(document).find("meta[name=viewport]");
    return meta.length > 0;
}

NacMedia.toggleHorzVideoList = function (media) {
    var list = media.find(".nac_play_list");
    var items = list.find(".nac_items");
    var container = media.find(".nac_video_container");
    var player = container.find(".nac_player");
    var width = container.width();
    var height = container.height();
    var naturalWidth = player[0].videoWidth;
    var naturalHeight = player[0].videoHeight;
    var listSize = parseInt(media.attr("data-list-size"), 10);

    var can = NacMedia.canAnimateIfHorizontalVideo(media);
    if (list.hasClass("nac_display_none")) {
        width -= listSize;
        list.removeClass("nac_display_none");
        if (can) {
            list.stop(true, true).animate({ "width": listSize + "px" }, 200);
        }
    }
    else {
        width += listSize;
        if (can) {
            list.stop(true, true).animate({ "width": "0px" }, 200, function () {
                list.addClass("nac_display_none");
            });
        }
        else {
            list.addClass("nac_display_none");
        }
    }

    if (width / height > naturalWidth / naturalHeight) {
        var newHeight = height;
        var newWidth = height * naturalWidth / naturalHeight;
    }
    else {
        var newWidth = width;
        var newHeight = width * naturalHeight / naturalWidth;
    }

    if (can) {
        player.stop(true, true).animate({ "width": newWidth + "px", "height": newHeight + "px" }, 200, function () {
            NacMedia.update(media);
        });
    }
    else {
        player.css({ "width": newWidth + "px", "height": newHeight + "px" });
        NacMedia.update(media);
    }
}

NacMedia.toggleVertVideoList = function (media) {
    var items = media.find(".nac_items");
    var container = media.find(".nac_video_container");
    var player = container.find(".nac_player");
    var width = container.width();
    var height = container.height();
    var naturalWidth = player[0].videoWidth;
    var naturalHeight = player[0].videoHeight;
    var listSize = parseInt(media.attr("data-list-size"), 10);

    if (items.hasClass("nac_display_none")) {
        height -= listSize;
        items.removeClass("nac_display_none");
        items.stop(true, true).animate({ "height": listSize + "px" }, 200);
    }
    else {
        height += listSize;
        items.stop(true, true).animate({ "height": "0px" }, 200, function () {
            items.addClass("nac_display_none");
        });
    }

    if (width / height > naturalWidth / naturalHeight) {
        var newHeight = height;
        var newWidth = height * naturalWidth / naturalHeight;
    }
    else {
        var newWidth = width;
        var newHeight = width * naturalHeight / naturalWidth;
    }

    player.stop(true, true).animate({ "width": newWidth + "px", "height": newHeight + "px" }, 200, function () {
        NacMedia.update(media);
    });
}

NacMedia.initVideoSize = function (media) {
    var container = media.find(".nac_video_container");
    var player = container.find(".nac_player");
    var width = container.width();
    var height = container.height();
    var naturalWidth = player[0].videoWidth;
    var naturalHeight = player[0].videoHeight;

    if (width / height > naturalWidth / naturalHeight) {
        var newHeight = height;
        var newWidth = height * naturalWidth / naturalHeight;
    }
    else {
        var newWidth = width;
        var newHeight = width * naturalHeight / naturalWidth;
    }
    player.css({ "width": newWidth + "px", "height": newHeight + "px" });
}

NacMedia.play = function (media) {
    media.find(".nac_player")[0].play();
}

NacMedia.pause = function (media) {
    media.find(".nac_player")[0].pause();
}

NacMedia.ensureVisible = function (parent, child, horz) {
    if (horz) {
        var left = child.offset().left - parent.offset().left;
        if (left < 0) {
            parent.scrollLeft(parent.scrollLeft() + left);
        }
        else {
            var width = child.outerWidth();
            var parentWidth = parent.width();
            if (parentWidth < left + width)
                parent.scrollLeft(parent.scrollLeft() + (left + width - parentWidth));
        }
    }
    else {
        var top = child.offset().top - parent.offset().top;
        if (top < 0) {
            parent.scrollTop(parent.scrollTop() + top);
        }
        else {
            var height = child.outerHeight();
            var parentHeight = parent.height();
            if (parentHeight < top + height)
                parent.scrollTop(parent.scrollTop() + (top + height - parentHeight));
        }
    }
}

NacMedia.playItem = function (media, oldItem, newItem) {
    if (newItem.length != 1)
        return;

    if (oldItem.length == 1 && oldItem[0] != newItem[0])
        oldItem.removeClass("nac_active");

    var player = media.find(".nac_player");
    var volume = player[0].volume;
    if (NacMedia.isAudio(media)) {
        newItem.addClass("nac_active");
        NacMedia.ensureVisible(media.find(".nac_items"), newItem, false);
        if (media.hasClass("nac_shuffle"))
            newItem.addClass("nac_played");
        player.attr("src", newItem.find(".nac_mm_dummy").attr("src"));
        player.attr("poster", "");
        player[0].currentTime = 0;
        player[0].volume = volume;
        NacMedia.play(media);
        NacMedia.update(media);
    }
    else {
        newItem.addClass("nac_active");
        NacMedia.ensureVisible(media.find(".nac_items"), newItem, media.hasClass("nac_video_vert"));
        player.stop(true, true).animate({ "opacity": "0" }, 500, function () {
            if (media.hasClass("nac_shuffle"))
                newItem.addClass("nac_played");
            player.attr("src", newItem.find(".nac_mm_dummy").attr("src"));
            player.attr("poster", "");
            player[0].currentTime = 0;
            player[0].volume = volume;
            player.stop(true, true).animate({ "opacity": "1" }, 500, function () {
                NacMedia.play(media);
                NacMedia.update(media);
            });
        });
    }
}

NacMedia.playButtonItem = function (media, play) {
    var player = media.find(".nac_player");
    player[0].currentTime = 0;
    play ? NacMedia.play(media) : NacMedia.pause(media);
    NacMedia.update(media);
}

NacMedia.playNextButtonItem = function (media) {
    var buttons = $(".nac_audio_button");
    if (buttons.length < 2)
        return;
    
    var index = -1;
    for (var i = 0; i < buttons.length; i++) {
        if (buttons.eq(i)[0] == media[0]) {
            index = (i == buttons.length - 1) ? 0 : i + 1;
            break;
        }
    }
    if (index == -1)
        return;

    var newMedia = buttons.eq(index);
    var player = newMedia.find(".nac_player");
    player[0].currentTime = 0;
    NacMedia.play(newMedia);
    //NacMedia.update(newMedia);
}

NacMedia.playShuffle = function (media, byUser) {
    if (!media.hasClass("nac_shuffle"))
        return false;

    var current = media.find(".nac_item.nac_active");
    if (current.length == 0)
        return false;

    var notPlayedItems = media.find(".nac_item:not(.nac_played)");
    if (notPlayedItems.length == 0) {
        if (!byUser && !media.hasClass("nac_repeat")) {
            NacMedia.pause(media);
            return true;
        }
        media.find(".nac_item").removeClass("nac_played");
        current.addClass("nac_played");
        notPlayedItems = media.find(".nac_item:not(.nac_played)");
    }

    var index = Math.floor(Math.random() * 1000) % notPlayedItems.length;
    var newItem = notPlayedItems.eq(index);
    NacMedia.playItem(media, current, newItem);
    return true;
}

NacMedia.handlePlay = function () {
    var media = NacMedia.parentMediaElement($(this));
    media.find(".nac_play").addClass("nac_display_none");
    media.find(".nac_pause").removeClass("nac_display_none");

    var index = NacMedia.playingNodes.indexOf(media[0]);
    if (index < 0)
        NacMedia.playingNodes.push(media[0]);

    if (NacMedia.isVideo(media))
        media.find(".nac_play_button").css("opacity", "0");

    NacMedia.mediaPlayed(media);
}

NacMedia.handlePause = function () {
    var media = NacMedia.parentMediaElement($(this));
    media.find(".nac_play").removeClass("nac_display_none");
    media.find(".nac_pause").addClass("nac_display_none");

    var index = NacMedia.playingNodes.indexOf(media[0]);
    if (index >= 0)
        NacMedia.playingNodes.splice(index, 1);

    if (NacMedia.isVideo(media))
        media.find(".nac_play_button").css("opacity", "1");

    NacMedia.mediaPaused(media);
}

NacMedia.onShow = function (event) {
    if (event.target == this) {
        var media = $(this);
        if (NacMedia.isVideo(media)) {
            NacMedia.initVideoSize(media);
        }
        else if (NacMedia.isAudio(media)) {
            var mediaHeight = media.outerHeight();
            var playListSize = media.find(".nac_play_list").outerHeight();
            media.attr("data-media-size", mediaHeight);
            media.attr("data-list-size", playListSize);
        }
        NacMedia.autoPlay(media);
        NacMedia.setThumbPosition(media.find(".nac_current_volume"), media.find(".nac_player")[0].volume);
        NacMedia.update(media);
    }
    event.stopPropagation();
}

NacMedia.onPlay = function () {
    var media = NacMedia.parentMediaElement($(this));
    NacMedia.play(media);
}

NacMedia.onPause = function () {
    var media = NacMedia.parentMediaElement($(this));
    NacMedia.pause(media);
}

NacMedia.onVideoContainerClick = function () {
    var media = NacMedia.parentMediaElement($(this));
    if (media.hasClass("nac_click_play"))
        NacMedia.onPlayOrPause(media);
    
}

NacMedia.onPlayOrPause = function (media) {
    if (media.find(".nac_pause").hasClass("nac_display_none")) {
        NacMedia.play(media);
        return;
    }

    if (media.hasClass("standby")) {
        clearTimeout(NacMedia.pauseTimer[media]);
        media.find(".nac_pause_button").css("opacity", "0");
        media.removeClass("standby");
        NacMedia.pause(media);
    }
    else {
        media.find(".nac_pause_button").css("opacity", "1");
        media.addClass("standby");
        NacMedia.pauseTimer[media] = setTimeout(function () {
            media.find(".nac_pause_button").css("opacity", "0");
            media.removeClass("standby");
        }, 2000);
    }
}

NacMedia.onVolume = function () {
    var media = NacMedia.parentMediaElement($(this));
    media.find(".nac_volume").addClass("nac_display_none");
    media.find(".nac_mute").removeClass("nac_display_none");
    media.find(".nac_player")[0].muted = true;
    NacMedia.setThumbPosition(media.find(".nac_current_volume"), 0);
}

NacMedia.onMute = function () {
    var media = NacMedia.parentMediaElement($(this));
    media.find(".nac_volume").removeClass("nac_display_none");
    media.find(".nac_mute").addClass("nac_display_none");
    media.find(".nac_player")[0].muted = false;
    NacMedia.setThumbPosition(media.find(".nac_current_volume"), media.find(".nac_player")[0].volume);
}

NacMedia.onFullScreen = function () {
    var media = NacMedia.parentMediaElement($(this));
    media.find(".nac_player")[0].webkitEnterFullscreen();
}

NacMedia.onList = function () {
    var media = NacMedia.parentMediaElement($(this));
    NacMedia.toggleList(media);
}

NacMedia.onFirst = function () {
    var media = NacMedia.parentMediaElement($(this));
    var current = media.find(".nac_item.nac_active");
    var newItem = media.find(".nac_item").first();
    NacMedia.playItem(media, current, newItem);
}

NacMedia.onLast = function () {
    var media = NacMedia.parentMediaElement($(this));
    var current = media.find(".nac_item.nac_active");
    var newItem = media.find(".nac_item").last();
    NacMedia.playItem(media, current, newItem);
}

NacMedia.onPrev = function () {
    var media = NacMedia.parentMediaElement($(this));
    if (NacMedia.playShuffle(media, true))
        return;

    var current = media.find(".nac_item.nac_active");
    if (current.length == 0)
        return;

    var player = media.find(".nac_player");
    if (player[0].currentTime > 5) {
        NacMedia.playItem(media, current, current);
        return;
    }

    var newItem = current.prev(".nac_item");
    if (newItem.length == 0)
        newItem = media.find(".nac_item").last();
    NacMedia.playItem(media, current, newItem);
}

NacMedia.onNext = function () {
    var media = NacMedia.parentMediaElement($(this));
    if (NacMedia.playShuffle(media, true))
        return;

    var current = media.find(".nac_item.nac_active");
    if (current.length == 0)
        return;

    var newItem = current.next(".nac_item");
    if (newItem.length == 0)
        newItem = media.find(".nac_item").first();
    NacMedia.playItem(media, current, newItem);
}

NacMedia.onShuffleOn = function () {
    var media = NacMedia.parentMediaElement($(this)).addClass("nac_shuffle");
    media.find(".nac_shuffle_on").addClass("nac_display_none");
    media.find(".nac_shuffle_off").removeClass("nac_display_none");
    media.find(".nac_item.nac_played").removeClass("nac_played");
}

NacMedia.onShuffleOff = function () {
    var media = NacMedia.parentMediaElement($(this)).removeClass("nac_shuffle");
    media.find(".nac_shuffle_on").removeClass("nac_display_none");
    media.find(".nac_shuffle_off").addClass("nac_display_none");
}

NacMedia.onPlayItem = function () {
    if (NacMedia.scroller.moving)
        return;
    var media = NacMedia.parentMediaElement($(this));
    var current = media.find(".nac_item.nac_active");
    if (current.length == 1 && this == current[0])
        return;

    NacMedia.playItem(media, current, $(this));
}

NacMedia.prevent = function (event) {
    event.stopPropagation();
    event.preventDefault();
}

NacMedia.onMouseDownTime = function (event) {
    NacMedia.scroller.target = this;
    NacMedia.scroller.state = 1;
    NacMedia.handleDown(event.pageX, -1);
    NacMedia.prevent(event);
}

NacMedia.onMouseDownVolume = function (event) {
    NacMedia.scroller.target = this;
    NacMedia.scroller.state = 2;
    NacMedia.handleDown(event.pageX, -1);
    NacMedia.prevent(event);
}

NacMedia.onMouseDownSimpleTime = function (event) {
    var target = $(event.target);
    if (!target.hasClass("nac_current_simple_time"))
        return;
    var media = NacMedia.parentMediaElement(target);
    if (media.hasClass("nac_simple"))
        return;

    NacMedia.scroller.target = this;
    NacMedia.scroller.state = 3;
    NacMedia.handleDown(event.pageX, event.pageY);
    NacMedia.prevent(event);
}

NacMedia.onMouseDownItems = function (event) {
    NacMedia.scroller.target = this;
    NacMedia.scroller.state = 4;
    NacMedia.handleDown(event.clientX, event.clientY);
    NacMedia.prevent(event);
}

NacMedia.onMouseMove = function (event) {
    if (NacMedia.scroller.state == 0)
        return;
    else if (NacMedia.scroller.state == 4)
        NacMedia.handleMove(event.clientX, event.clientY, 5);
    else
        NacMedia.handleMove(event.pageX, event.pageY, -1);
    NacMedia.prevent(event);
}

NacMedia.onMouseUp = function (event) {
    if (NacMedia.scroller.state == 0)
        return;
    NacMedia.handleUp();
    NacMedia.prevent(event);
}

NacMedia.onTouchTime = function (event) {
    var touches = event.originalEvent.touches;
    if (!touches || touches.length != 1) {
        NacMedia.handleUp();
        return;
    }

    NacMedia.scroller.target = this;
    NacMedia.scroller.state = 1;
    NacMedia.handleDown(touches[0].pageX, -1);
    NacMedia.prevent(event);
}

NacMedia.onTouchVolume = function (event) {
    var touches = event.originalEvent.touches;
    if (!touches || touches.length != 1) {
        NacMedia.handleUp();
        return;
    }

    NacMedia.scroller.target = this;
    NacMedia.scroller.state = 2;
    NacMedia.handleDown(touches[0].pageX, -1);
    NacMedia.prevent(event);
}

NacMedia.onTouchSimpleTime = function (event) {
    var touches = event.originalEvent.touches;
    if (!touches || touches.length != 1) {
        NacMedia.handleUp();
        return;
    }

    var target = $(event.target);
    if (!target.hasClass("nac_current_simple_time"))
        return;
    var media = NacMedia.parentMediaElement(target);
    if (media.hasClass("nac_simple"))
        return;

    NacMedia.scroller.target = this;
    NacMedia.scroller.state = 3;
    NacMedia.handleDown(touches[0].pageX, touches[0].pageY);
    NacMedia.prevent(event);
}

NacMedia.onTouchItems = function (event) {
    var touches = event.originalEvent.touches;
    if (!touches || touches.length != 1) {
        NacMedia.handleUp();
        return;
    }

    NacMedia.scroller.target = this;
    NacMedia.scroller.state = 4;
    NacMedia.handleDown(touches[0].clientX, touches[0].clientY);
    NacMedia.prevent(event);
}

NacMedia.onTouchMove = function (event) {
    var touches = event.originalEvent.changedTouches;
    if (!touches || touches.length != 1) {
        NacLLTab.handleUp();
        return;
    }

    if (NacMedia.scroller.state == 0)
        return;
    else if (NacMedia.scroller.state == 4)
        NacMedia.handleMove(touches[0].clientX, touches[0].clientY, 30);
    else
        NacMedia.handleMove(touches[0].pageX, touches[0].pageY, -1);
    NacMedia.prevent(event);
}

NacMedia.onTouchEnd = function (event) {
    if (NacMedia.scroller.state == 0)
        return;
    NacMedia.handleUp();
    NacMedia.prevent(event);
}

NacMedia.handleDownOnItems = function (x, y) {
    var media = NacMedia.parentMediaElement($(NacMedia.scroller.target));
    NacMedia.scroller.horzScroll = media.hasClass("nac_video_vert");
    NacMedia.scroller.downPosition = NacMedia.scroller.horzScroll ? x : y;
    NacMedia.scroller.scrollPosition = NacMedia.scroller.horzScroll ? NacMedia.scroller.target.scrollLeft : NacMedia.scroller.target.scrollTop;
}

NacMedia.handleMoveOnItems = function (x, y, gap) {
    var newPosition = NacMedia.scroller.horzScroll ? x : y;
    var offset = NacMedia.scroller.downPosition - newPosition;
    if (!NacMedia.scroller.moving && Math.abs(offset) < gap)
        return false;

    if (!NacMedia.scroller.moving) {
        var media = NacMedia.parentMediaElement($(NacMedia.scroller.target));
        media.find(".nac_item").addClass("nac_no_hover");
        NacMedia.scroller.moving = true;
    }

    var newScrollPosition = NacMedia.scroller.scrollPosition + offset;
    if (NacMedia.scroller.horzScroll)
        NacMedia.scroller.target.scrollLeft = newScrollPosition;
    else
        NacMedia.scroller.target.scrollTop = newScrollPosition;
    return true;
}

NacMedia.handleUpOnItems = function () {
    var media = NacMedia.parentMediaElement($(NacMedia.scroller.target));
    media.find(".nac_item").removeClass("nac_no_hover");
    setTimeout(function () {
        NacMedia.scroller.moving = false;
    }, 1);
}

NacMedia.handleDown = function (x, y) {
    if (NacMedia.scroller.state == 1)
        NacMedia.updateTimeBar($(NacMedia.scroller.target), x);
    else if (NacMedia.scroller.state == 2)
        NacMedia.updateVolumeBar($(NacMedia.scroller.target), x);
    else if (NacMedia.scroller.state == 3)
        NacMedia.updateSimpleTimeBar($(NacMedia.scroller.target), x, y);
    else if (NacMedia.scroller.state == 4)
        NacMedia.handleDownOnItems(x, y);
}

NacMedia.handleMove = function (x, y, gap) {
    if (NacMedia.scroller.state == 1)
        NacMedia.updateTimeBar($(NacMedia.scroller.target), x);
    else if (NacMedia.scroller.state == 2)
        NacMedia.updateVolumeBar($(NacMedia.scroller.target), x);
    else if (NacMedia.scroller.state == 3)
        NacMedia.updateSimpleTimeBar($(NacMedia.scroller.target), x, y);
    else if (NacMedia.scroller.state == 4)
        NacMedia.handleMoveOnItems(x, y, gap);
}

NacMedia.handleUp = function () {
    if (NacMedia.scroller.state == 4)
        NacMedia.handleUpOnItems();
    NacMedia.scroller.target = null;
    NacMedia.scroller.state = 0;
}

NacMedia.onEnded = function () {
    var media = NacMedia.parentMediaElement($(this));
    NacMedia.mediaEnded(media);
    if (media.hasClass("nac_audio_button")) {
        NacMedia.playButtonItem(media, media.hasClass("nac_repeat"));
        if (media.hasClass("nac_play_next"))
            NacMedia.playNextButtonItem(media);
        return;
    }

    if (NacMedia.playShuffle(media, false))
        return;

    var current = media.find(".nac_item.nac_active");
    var newItem = current.next(".nac_item");
    if (newItem.length == 0) {
        if (media.hasClass("nac_repeat"))
            newItem = $(media.find(".nac_item")[0]);
    }

    if (newItem.length == 0) {
        NacMedia.pause(media);
        NacMedia.update(media);
        return;
    }
    NacMedia.playItem(media, current, newItem);
}

NacMedia.updatePlayingAudioButton = function () {
    for (var i = 0; i < NacMedia.playingNodes.length; i++) {
        var media = $(NacMedia.playingNodes[i]);
        if (media.hasClass("nac_audio_button"))
            NacMedia.update(media);
    }
}

NacMedia.updatePlayingMedia = function () {
    for (var i = 0; i < NacMedia.playingNodes.length; i++) {
        var media = $(NacMedia.playingNodes[i]);
        if (!media.hasClass("nac_audio_button"))
            NacMedia.update(media);
    }
}

NacMedia.update = function (media) {
    var player = media.find(".nac_player")[0];
    var duration = player.duration;
    var currentTime = player.currentTime;
    if (isNaN(duration) || isNaN(currentTime))
        duration = currentTime = 0;
    var position = duration == 0 ? 0 : currentTime / duration;

    if (media.hasClass("nac_audio_button")) {
        NacMedia.drawAudioProgress(media, position);
    }
    else {
        NacMedia.setTime(media.find(".nac_time1"), Math.round(currentTime));
        NacMedia.setTime(media.find(".nac_time2"), Math.round(duration - currentTime));
        NacMedia.setThumbPosition(media.find(".nac_current_time"), position);
    }
    NacMedia.mediaProgress(media, !player.paused, currentTime);
}

NacMedia.thumbSize = function (node) {
    var thumb = node.find(".nac_thumb");
    return thumb.hasClass("nac_display_none") ? 0 : thumb.outerHeight();
}

NacMedia.updateTimeBar = function (node, x) {
    var thumbSize = NacMedia.thumbSize(node);
    var width = node.outerWidth() - thumbSize;
    var position = x - (node.offset().left + thumbSize / 2);
    if (position < 0)
        position = 0;
    else if (position > width)
        position = width;

    var ratio = position / width;
    var media = NacMedia.parentMediaElement(node);
    var player = media.find(".nac_player")[0];
    var duration = player.duration;
    var currentTime = ratio * duration;
    player.currentTime = currentTime;
    NacMedia.setTime(media.find(".nac_time1"), Math.round(currentTime));
    NacMedia.setTime(media.find(".nac_time2"), Math.round(duration - currentTime));
    NacMedia.setThumbPosition(node, ratio);
    NacMedia.mediaProgress(media, !player.paused, currentTime);
}

NacMedia.updateVolumeBar = function (node, x) {
    var thumbSize = NacMedia.thumbSize(node);
    var width = node.outerWidth() - thumbSize;
    var position = x - (node.offset().left + thumbSize / 2);
    if (position < 0)
        position = 0;
    else if (position > width)
        position = width;

    var ratio = position / width;
    var media = NacMedia.parentMediaElement(node);
    var player = media.find(".nac_player")[0];
    player.volume = ratio;
    NacMedia.setThumbPosition(node, ratio);
}

NacMedia.updateSimpleTimeBar = function (node, x, y) {
    x -= (node.offset().left + node.outerWidth() / 2);
    y -= (node.offset().top + node.outerHeight() / 2);
    var degree = Math.atan2(y, x) * 180 / Math.PI + 90;
    if (degree < 0)
        degree += 360;

    var ratio = degree / 360;
    var media = NacMedia.parentMediaElement(node);
    var player = media.find(".nac_player")[0];
    var duration = player.duration;
    var currentTime = ratio * duration;
    player.currentTime = currentTime;
    NacMedia.drawAudioProgress(media, ratio);
    NacMedia.mediaProgress(media, !player.paused, currentTime);
}

NacMedia.setTime = function (node, time) {
    var hour = Math.floor(time / 3600);
    var min = Math.floor((time % 3600) / 60);
    var sec = Math.floor((time % 3600) % 60);
    var value = "";
    if (hour > 0)
        value = hour + ":";
    if (min <= 9)
        value += "0";
    if (min <= 0)
        value += "0:";
    else
        value += min + ":";
    if (sec <= 9)
        value += "0";
    value += sec;
    node.html(value);
}

NacMedia.setThumbPosition = function (node, ratio) {
    var thumb = node.find(".nac_thumb");
    var currentBar = node.find(".nac_current_bar");
    var bufferBarWidth = node.find(".nac_buffer_bar").outerWidth();
    if (thumb.hasClass("nac_display_none")) {
        var currentBarWidth = bufferBarWidth * ratio;
        currentBar.css("width", currentBarWidth + "px");
    }
    else {
        var thumbSize = thumb.outerHeight();
        var thumbLeft = (bufferBarWidth - thumbSize) * ratio;
        var currentBarWidth = thumbLeft + thumbSize / 2;
        thumb.css("left", thumbLeft + "px");
        currentBar.css("width", currentBarWidth + "px");
    }
}

NacMedia.drawAudioProgress = function (node, ratio) {
    var canvas = node.find(".nac_audio_canvas");
    var context = canvas[0].getContext("2d");
    context.clearRect(0, 0, 100, 100);
    var start = -(Math.PI / 180) * 90;
    var end = start + (Math.PI / 180) * 360 * ratio;
    context.beginPath();
    context.moveTo(50, 50);
    context.arc(50, 50, 100, start, end);
    context.fillStyle = canvas.css("color");
    context.fill();
}




