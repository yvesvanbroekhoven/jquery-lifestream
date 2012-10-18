/*

Author: Yves Van Broekhoven
Date: 2009-11-03
Version: 1.0.1

jQuery Lifestream is blended especially for Veerle Pieters.
As mean feed machine we use Yahoo Pipes (http://pipes.yahoo.com)
to bundle and sort all our feeds.

How to use jQuery Lifestream? A little example:
------------------------------------------------------------
$(document).ready(function(){
    $('body').lifestream({ feed: 'http://pipes.yahoo.com/pipes/pipe.run?_id=b8598cf783e5b32cdd630b041a7d7064&_render=json&_callback=?' }, callbackFunction);
});

Parameters to customize your lifestream:
------------------------------------------------------------
feed                    = The yahoo pipe feed which is ofcourse required. Must be in JSON format.
lsContainer             = Container element for our lifestream. Must be an <ul>. Default $('ls_lifestream')
lsVisibleCount          = Number of items to initially show visible in lifestreamContainer. Default lifestreamCount
lsTwitterCount          = Number of Twitter items in lifestreamContainer. Default 10
lsLastfmCount           = Number of Last.fm items in lifestreamContainer. Default 15
lsDeliciousCount        = Number of Delicious items in lifestreamContainer. Default 15
lsFlickCount            = Number of Flickr items in lifestreamContainer. Default 4
twitterContainer        = Container element for our twitter stream. Must be an <ul>. Default $('ls_twitter')
twitterCount            = Number of items to show in twitterContainer. Default 20
twitterUsername         = Used to filter out your username in the twitter messages. Default empty string.
lastfmContainer         = Container element for our Last.fm stream. Must be an <ul>. Default $('ls_lastfm')
lastfmCount             = Number of items to show in lastfmContainer. Default 40
deliciousContainer      = Container element for our delicious stream. Must be an <ul>. Default $('ls_delicious')
deliciousCount          = Number of items to show in deliciousContainer. Default 40
flickrContainer         = Container element for our flickr stream. Must be an <ul>. Default $('ls_flickr')
flickrCount             = Number of items to show in flickrContainer. Default 10
flickrImageLinkTitle    = Title given to the link on the image. Default "Check this photo on Flickr"
flickrVideoLinkTitle    = Title given to the link on the video. Default "Check this video on Flickr"
loaderClass             = Given class to the loader container. Default 'loader' (<span class="loader"></span>)
filterCookie            = Name of the lifestream filter cookie. Default 'lifestream_filters'

*/

(function($){
        $.fn.lifestream = function(options, callback) {

        var defaults = {
            feed:                   '',
            lsContainer:            $('#ls_lifestream'),
            lsVisibleCount:         10,
            lsTwitterCount:         10,
            lsLastfmCount:          15,
            lsDeliciousCount:       15,
            lsFlickrCount:          4,
            twitterContainer:       $('#ls_twitter'),
            twitterCount:           20,
            twitterUsername:        '',
            lastfmContainer:        $('#ls_lastfm'),
            lastfmCount:            36,
            deliciousContainer:     $('#ls_delicious'),
            deliciousCount:         38,
            flickrContainer:        $('#ls_flickr'),
            flickrCount:            10,
            flickrImageLinkTitle:   'Check this photo on Flickr',
            flickrVideoLinkTitle:   'Check this video on Flickr',
            loaderClass:            'loader',
            filterCookie:           'lifestream_filters'
        };
        options = $.extend(defaults, options);

        return this.each(function() {
            obj = $(this);

            if (options.feed == '') {
                // No feed present? Well, then there's nothing to do here right?
                return false;
            } else {
                // Initialize global vars
                var lsCounter           = 0;
                var twitterCounter      = 0;
                var lastfmCounter       = 0;
                var deliciousCounter    = 0;
                var flickrCounter       = 0;
                //if (options.lsVisibleCount > options.lsCount) options.lsVisibleCount = options.lsCount;

                // Set loader gifs
                var loader  = '<span class="' + options.loaderClass + '"></span>';
                options.lsContainer.html(loader);
                options.twitterContainer.html(loader);
                options.lastfmContainer.html(loader);
                options.deliciousContainer.html(loader);
                options.flickrContainer.html(loader);
            }

            // The real action!
            $.getJSON(options.feed, function(data){
                // Remove loader gifs
                var loader_img  = $('.' + options.loaderClass);
                if (loader_img.length > 0) {
                   loader_img.remove();
                }
                // Loop results
                $.each(data.value.items, function(i, item){
                    var guid    = getSource(item);
                    var type    = getType(guid);
                    renderContent(item, type);
                });
                // Fire the callback function
                if (jQuery.isFunction(callback)) {
                    callback.call(this, data);
                }
            });

            function getSource(item)
            {
                if (item == undefined) { return false; }
                if (item.guid != undefined) {
                    if (typeof(item.guid) == 'string') {
                        return item.guid;
                    } else if (item.guid.content != undefined) {
                        if (typeof(item.guid.content) == 'string') {
                            return item.guid.content;
                        } else return false;
                    }
                } else if (item.url != undefined) {
                    if (typeof(item.url) == 'string') {
                        return item.url;
                    } else {
                        return false;
                    }
                } else if (item['dc:identifier'] != undefined) {
                    if (typeof(item['dc:identifier']) == 'string') {
                       return item['dc:identifier']
                    } else {
                      return false;
                    }
                } else {
                    return undefined;
                }
            }

            function getType(guid)
            {
                if (guid == undefined) { return false; }
                var type = undefined;
                if (guid.search('twitter') > -1)        { type = 'twitter' }
                if (guid.search('flickr') > -1)         { type = 'flickr' }
                if (guid.search('last.fm') > -1)        { type = 'lastfm' }
                if (guid.search('delicious.com') > -1)  { type = 'delicious' }
                if (guid.search('pinboard') > -1)       { type = 'delicious' }
                return type;
            }

            function renderContent(item, type)
            {
                if (type == undefined) return false;
                switch(type) {
                    case 'twitter' :
                        renderTwitter(item, type);
                        break;
                    case 'flickr' :
                        renderFlickr(item, type);
                        break;
                    case 'lastfm' :
                        renderLastFm(item, type);
                        break;
                    case 'delicious' :
                        renderDelicious(item, type);
                        break;
                    default :
                        renderText(item);
                }
            }

            function renderTwitter(item, type)
            {
                var text        = item.description;
                var url         = item.guid;
                var timestamp   = item.pubDate.replace('+0000','');
                timestamp       = timestamp.slice(0, (timestamp.length - 4)); // Chop off seconds

                if(text.search(/(https?:\/\/[-\w\.]+:?\/[\w\/_\.]*(\?\S+)?)/) > -1) {
                    text = text.replace(/(https?:\/\/[-\w\.]+:?\/[\w\/_\.]*(\?\S+)?)/, "<a href='$1'>$1</a>")
                }
                if(text.search(/@\w+/) > -1) {
                    text = text.replace(/(@)(\w+)/g, "$1<a href='http://twitter.com/$2'>$2</a>");
                }
                text = text.replace(options.twitterUsername + ':','');

                var stream_item = '<li class="' + type +'"><p>' + text + '</p><p class="timestamp"><a href="' + url +'">' + timestamp + '</a></p></li>';

                lifestreamAppend(stream_item, type);
                if (options.twitterContainer.length > 0 && twitterCounter < options.twitterCount) {
                    options.twitterContainer.append(stream_item);
                }

                twitterCounter++;
            }

            function renderFlickr(item, type)
            {
                var content         = item['media:content'];
                var content_item    = content ? content.url : '';
                var url             = item.link;
                var title           = item.title;
                var pub_date        = item.pubDate;
                var stream_item;

                if (content_item.indexOf('video') > 0) {
                    // Video
                    stream_item = '<li class="' + type + '"><a href="' + url + '" title="' + options.flickrVideoLinkTitle + '" class="video">' + title + '</a></li>';
                } else {
                    // Image
                    stream_item = '<li class="' + type + '"><a href="' + url + '" title="' + options.flickrImageLinkTitle + '"><img src="' + content_item + '" alt="' + title + '" /></a></li>';
                }

                lifestreamAppend(stream_item, type);
                if (options.flickrContainer.length > 0 && flickrCounter < options.flickrCount) {
                    options.flickrContainer.append(stream_item);
                }

                flickrCounter++;
            }

            function renderLastFm(item, type)
            {
                var artist      = item.artist.name;
                var title       = item.name;
                var artist_url  = 'http://www.last.fm/music/' + encodeURI(artist);
                var title_url   = 'http://www.last.fm/music/' + encodeURI(artist) + '/_/' + encodeURI(title);
                var pub_date    = item.date.content;

                var stream_item = '<li class="' + type +'"><a href="' + artist_url + '" title="Check out ' + artist + ' on Last.fm">' + artist + '</a> - <a href="' + title_url + '" title="Check out ' + title + ' by ' + artist + ' on Last.fm">' + title + '</a></li>';

                lifestreamAppend(stream_item, type);
                if (options.lastfmContainer.length > 0 && lastfmCounter < options.lastfmCount) {
                    options.lastfmContainer.append(stream_item);
                }

                lastfmCounter++;
            }

            function renderDelicious(item, type)
            {
                var title       = item.title;
                var url         = item.link;
                var pub_date    = item.pubDate;

                var stream_item = '<li class="' + type +'"><a href="' + url + '" title="Visit this bookmark">' + title + '</a></li>';

                lifestreamAppend(stream_item, type);
                if (options.deliciousContainer.length > 0 && deliciousCounter < options.deliciousCount) {
                    options.deliciousContainer.append(stream_item);
                }

                deliciousCounter++;
            }

            function renderText(item)
            {
                if (item.title != undefined) {
                    var title   = item.title;

                    var stream_item = '<li>' + title + '</li>';

                    if ($('#lifestream').length > 0)    { $('#lifestream').append(stream_item) }
                }
            }

            function lifestreamAppend(item, type)
            {
                switch(type) {
                    case 'twitter' :
                        if (twitterCounter > options.lsTwitterCount) {
                            return false;
                        }
                        break;
                    case 'flickr' :
                        if (flickrCounter > options.lsFlickrCount) {
                            return false;
                        }
                        break;
                    case 'lastfm' :
                        if (lastfmCounter > options.lsLastfmCount) {
                            return false
                        }
                        break;
                    case 'delicious' :
                        if (deliciousCounter > options.lsDeliciousCount) {
                            return false
                        }
                        break;
                    default :
                        renderText(item);
                }
                if (options.lsContainer.length > 0 )  {
                    options.lsContainer.append(item);
                    lastItem            = options.lsContainer.find('li:last');
                    lsCurrentVisible    = options.lsContainer.find('li:visible').length;
                    if (lsCurrentVisible >= options.lsVisibleCount || filterItem(lastItem)) {
                        lastItem.hide();
                    }
                    lsCounter++;
                }

            }

            function removeLoader(type)
            {
                //$('.' + options.loaderClass).remove();
            }

            function filterItem(item)
            {
                var filtered        = false;
                var filter_cookie   = readCookie(options.filterCookie);
                if (filter_cookie) {
                    filter_cookie   = filter_cookie.split(',');
                    $.each(filter_cookie, function(i, n){
                        if (item.hasClass(n)) {
                            filtered    = true;
                        }
                    });
                    if (filtered) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        });
    };
})(jQuery);

function createCookie(name, value, days)
{
  if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    var expires = "; expires="+date.toGMTString();
  }
  else var expires = "";
  document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name)
{
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
    var c = ca[i];
    while (c.charAt(0)==' ') c = c.substring(1,c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}

function eraseCookie(name)
{
  createCookie(name,"",-1);
}
