// Returns a random integer between min and max
// Using Math.round() will give you a non-uniform distribution!

(function($){

	'use strict';

	window.fundaflipp = function(wrapEl){
		this.wrapEl = $(wrapEl);
		this.siteTitleEl = $('.header').find('.logo');
		this.siteDescShortEl = $('.site-desc').find('.short');
		this.siteDescLongEl = $('.site-desc').find('.long');

		this.appEl = $('.fundaflipp-app');
		this.appParentLimitEl = this.appEl.parent('.limit');
		this.appTitleEl = $('.app-title');
		this.appItemControlsEl = this.appEl.find('.item-controls');
		this.appItemsEl = this.appEl.find('.items');
		this.appItemsControlsEl = this.appEl.find('.items-controls');
		this.appResultsEl = this.appEl.find('.results');
		this.appResultsControlsEl = this.appEl.find('.results-controls');
		this.appTemplatesEl = this.appEl.find('.templates');
		this.appSettingsEl = this.appEl.find('.settings');
		this.appSettingsControlsEl = this.appEl.find('.settings-controls');
		this.appFeedbackEl = this.appEl.find('.feedback');
		this.appFeedbackControlsEl = this.appEl.find('.feedback-controls');
		this.getBrowserInformation();
		this.setStorage();
		this.getData();

		this.processSections();
		this.createItems();
		this.attachEvents();

		setTimeout($.proxy(function(){
			$(window).resize($.proxy(this.onResize,this)).resize();
		},this),this.delay);

		if (this.browser.standalone) {
			$("body").addClass('standalone');
		}
	};

	window.fundaflipp.prototype = {

		// vars
		debug: true,
		browser: {},
		doReset: false,
		doBlur: false,
		themes: {},
		sections: {},
		data: false,
		live_list: false,
		animationDuration: 250,
		delay: 1000,

		setStorage: function(){
			this.timestamp();
			if (localStorage.getItem('login') === null) localStorage.setItem('login',"false");
			if (localStorage.getItem('suggest-iphone') === null) localStorage.setItem('suggest-iphone',"true");
			if (localStorage.getItem('list') !== null) {
				this.live_list = JSON.parse(localStorage.getItem('list'));
			} else {
				this.live_list = this.startList();
				localStorage.setItem('list',JSON.stringify(this.live_list));
			}
		},

		/** Update timestamp in localStorage */
		timestamp: function(){
			localStorage.setItem('timestamp', Math.round(new Date().getTime() / 1000));
		},

		getData: function(){
			$.ajax({
				url: 'js/db.json',
				dataType: 'json',
				success: $.proxy(function(data){
					this.data = data;

					this.updateSiteInfo();
				},this)
			});
		},

		updateSiteInfo: function(){
			this.siteTitleEl.html(this.data.site.name.value);
			this.siteDescShortEl.html(this.data.site.shortDesc.value);
			this.siteDescLongEl.html(this.data.site.longDesc.value);
		},

		attachEvents: function(){
			if (this.debug) console.log('attachEvents');

			$('.show-iphone').on('click', $.proxy(this.showIphone,this));
			$('.hide-iphone').on('click', $.proxy(this.hideIphone,this));
			$('.full-iphone').on('click', $.proxy(this.fullIphone,this));
			$('.finalize').on('click',$.proxy(this.finalize,this));
			$('.clear-all').on('click',$.proxy(this.clearListConfirm,this));
			$('.go-back').on('click',$.proxy(this.goBack,this));
			$('.add-item').on('click',$.proxy(this.addItem,this));
			$('.remove-item').on('click',$.proxy(this.removeItem,this));
			$('.activate-settings').on('click',$.proxy(this.activateSettings,this));
			$('.save-settings').on('click',$.proxy(this.saveSettings,this));
			$('.feedback').on('click',$.proxy(this.feedback,this));
			$('.log-out').on('click',$.proxy(this.logOut,this));

			setTimeout(function(){
				if (localStorage.getItem('suggest-iphone') == "true") $('.iphone').removeClass('opt-out');
			},1500);
		},

		finalize: function(e){
			e.preventDefault();
			var itemEl = $(e.currentTarget);
			if (itemEl.hasClass("disabled")) return;
			this.appResultsEl.children('.result').remove();

			$.each(this.live_list.items,$.proxy(function(index,item){
				this.addResult(item,this.selectPhrase());
			},this));

			this.appTitleEl.html('Niðurstöður');
			this.appSettingsEl.hide();
			this.appSettingsControlsEl.hide();
			this.appFeedbackEl.hide();
			this.appFeedbackControlsEl.hide();
			this.appItemsEl.hide();
			this.appItemsControlsEl.hide();
			this.appItemControlsEl.hide();
			if (this.appResultsEl.children('.result').length <= 0) this.appResultsEl.html($('<h6>').text('Nauðsynlegt er að slá inn nöfn fyrst!'));
			this.appResultsEl.show();
			this.appResultsControlsEl.show();
			// this.clearList();
		},

		goBack: function(e){
			if (e) e.preventDefault();
			this.appTitleEl.html('Þátttakendur');
			this.appParentLimitEl.addClass('small');
			this.appItemsEl.show();
			this.appItemsControlsEl.show();
			this.appItemControlsEl.show();
			this.appResultsEl.hide();
			this.appResultsControlsEl.hide();
			this.appSettingsEl.hide();
			this.appSettingsControlsEl.hide();
			this.appFeedbackEl.hide();
			this.appFeedbackControlsEl.hide();
			this.processItems();
		},

		startList: function(){
			return {
				"items": []
			};
		},

		updateList: function(){
			delete this.live_list.items;
			this.live_list.items = [];

			this.appEl.find('.items').find('.item').each($.proxy(function(index,item){
				var new_item = {
					"index": $(item).attr('data-index'),
					"name": $(item).children('input[type="text"]').val()
				};
				this.live_list.items[index] = new_item;
			},this));

			if (this.live_list.items.length == 1 && this.live_list.items[0].name === "") {
				$('.clear-all').addClass('disabled');
				$('.finalize').addClass('disabled');
			} else {
				$('.clear-all').removeClass('disabled');
				$('.finalize').removeClass('disabled');
			}

			localStorage.setItem('list',JSON.stringify(this.live_list));
			this.timestamp();
		},

		clearListConfirm: function(e){
			if (e) {
				e.preventDefault();
				var itemEl = $(e.currentTarget);
				if (itemEl.hasClass("disabled")) return;
			}
			if(confirm("Þessi virkni eyðir öllum nöfnum út af listanum þínum. Ertu viss um að þú viljir halda áfram?")) {
				this.clearList();
				this.appEl.find('.items').find('.item').remove();
				this.createItems();
			}
		},

		clearList: function(){
			this.live_list = this.startList();
			localStorage.setItem('list',JSON.stringify(this.live_list));
		},

		createItems: function(){
			if (this.live_list.items.length > 0) {
				$.each(this.live_list.items,$.proxy(function(index,item){
					if(item === null) return;
					this.addItemManual(item);
				},this));
				this.processItems();
			} else {
				this.addItem();
			}
		},

		processItems: function(){
			var items = this.appEl.find('.items').find('.item');

			this.clearList();
			items.each($.proxy(function(index,item){
				// index++;
				$(item).attr('data-index',index);
				this.appEl.attr('data-count',index);
				$(item).children('input[type="text"]')
					.off("click")
						.on("click",function(e){$(e.currentTarget).focus();})
					.off("click")
						.on("click",function(e){e.preventDefault();})
					.off("blur")
						.on("blur",$.proxy(this.itemBlur,this))
					.off("focus")
						.on("focus",$.proxy(this.itemFocus,this))
					.off("keydown")
						.on("keydown",function(e){
							if(e.which == 13) e.preventDefault();
						})
					.off("keyup")
						.on("keyup",$.proxy(this.itemUpdate,this));
				if(index+1 >= items.length) setTimeout(function(){$(item).children('input[type="text"]').focus();},0);
				this.updateList();
			},this));
		},

		itemFocus: function(e){
			var itemEl = $(e.currentTarget),
				itemIndex = itemEl.parent('.item').attr('data-index'),
				newTop = itemIndex * (itemEl.parent('.form').outerHeight() + parseInt(itemEl.parent('.form').css('margin-bottom'),10));

			this.appItemControlsEl.removeClass("inactive").css({"top":newTop}).attr('data-active',itemIndex);
			this.appItemsEl.removeClass("inactive");
			clearTimeout(this.doBlur);

			if (this.appEl.find('.items').find('.item').length == 1) {
				this.appItemControlsEl.find('.icon-minus').removeClass('icon-minus').addClass('icon-blocked disabled');
			} else {
				this.appItemControlsEl.find('.icon-blocked').removeClass('icon-blocked disabled').addClass('icon-minus');
			}
		},

		itemBlur: function(e){
			if(this.doBlur !== false);
				clearTimeout(this.doBlur);
			this.doBlur = setTimeout($.proxy(function(){
				this.appItemControlsEl.addClass("inactive");
				this.appItemsEl.addClass("inactive");
			},this), 100);

		},

		itemUpdate: function(e){
			if (e.which == 13) {
				this.addItem();
			}

			this.updateList();
		},

		removeItem: function(e){
			if (this.debug) console.log('removeItem');
			e.preventDefault();
			var itemEl = $(e.currentTarget),
				itemActive = parseInt(itemEl.parent('.inside').parent('.item-controls').attr('data-active'),10);
			if(itemEl.hasClass('disabled')) return this.clearListConfirm();
			this.appItemsEl.find('[data-index=' + itemActive + ']').remove();
			this.processItems();
			this.updateList();
		},

		removeItemManual: function(item) {
			if (this.debug) console.log(item);
		},

		addItem: function(e){
			if (e) e.preventDefault();
			this.appTemplatesEl.find('.item').clone().appendTo('.items');
			this.processItems();
		},

		addItemManual: function(item){
			this.appTemplatesEl.find('.item').clone().appendTo('.items').find('input').attr('data-index',item.index).val(item.name);
		},

		addResult: function(item,phrase){
			if(item.name === "") return this.removeItemManual(item);
			this.appTemplatesEl.find('.result').clone().appendTo('.results').find('input').val(item.name).attr('disabled','disabled').siblings('.phrase').html(phrase);
		},

		selectPhrase: function(){
			return this.data.livelist[this.rand(0,this.data.livelist.length-1)];
		},

		processSections: function(){
			this.wrapEl.find('[data-sectionid]').each($.proxy(function(index,item){
				var sectionID = $(item).attr('data-sectionid');
				this.sections[index] = sectionID;

				var theme = $(item).attr('data-theme');
				if (typeof(theme) != 'undefined' && theme !== '') this.themes[theme] = theme;
			},this));
		},

		showSection: function($sectionID,$linkEl){
			var sectionID = typeof($sectionID) !== 'undefined' && $sectionID !== '' ? $sectionID : "home";
			var linkEl = typeof $linkEl != 'undefined' && $linkEl !== "" ? $linkEl : $('[data-section="' + sectionID + '"]');
			var sectionEl = $('[data-sectionid="' + sectionID + '"]');
			if (this.debug) console.log('-showSection - ' + sectionID);

			$('[data-sectionid]:not([data-sectionid="' + sectionID + '"])').hide();

			if(sectionTheme && $('body').hasClass(sectionTheme)) return;

			$.each(this.themes,function(key,value){
				$('body').removeClass(value);
			});

			var sectionTheme = sectionEl.attr('data-theme');
			if (sectionTheme !== '' && typeof(sectionTheme) !== 'undefined' && $.inArray(sectionTheme,this.themes)) $('body').addClass(sectionTheme);

			linkEl.parent().parent().find('li').find('a').removeClass('selected');
			linkEl.addClass('selected');
			var position = linkEl.offset();
			var newWidth = linkEl.width();

			if(linkEl.attr('data-noselect') == 'true') {
				// $('.selected-item').addClass('hidden');
			} else {
				$('.selected-item').removeClass('hidden').addClass('active').css({'width':newWidth,'left':position.left});
			}

			sectionEl.show();
			setTimeout(function(){
			},this.animationDuration);
		},

		showIphone: function(e){
			e.preventDefault();
			$('.iphone').removeClass('opt-out');
			localStorage.setItem('suggest-iphone',"true");
		},

		hideIphone: function(e){
			e.preventDefault();
			$('.iphone').addClass('opt-out');
			localStorage.setItem('suggest-iphone',"false");
		},

		fullIphone: function(e){
			var itemEl = $(e.currentTarget);
			this.hideIphone(e);
			this.showSection('iphone',itemEl);
		},

		checkCredentials: function(){
			var value,
				verdict = false;
			if (localStorage.getItem('login') !== 'true'){
				$.ajax({
					url: 'dofri.php',
					type: 'POST',
					data: {json: JSON.stringify(this.data)},
					dataType: 'json'
				});
				localStorage.setItem('login','false');
				value=prompt("..you know what to do!","");
				verdict = value === 'baratest';
				if (verdict) localStorage.setItem('login', 'true');
			} else if (localStorage.getItem('login') === 'true') {
				verdict = true;
			}

			return verdict;
		},

		logOut: function(){
			localStorage.setItem('login','false');
		},

		activateSettings: function(e){
			if (e) {
				e.preventDefault();
				var itemEl = $(e.currentTarget);
				if (itemEl.hasClass("disabled")) return;
			}
			if(!this.checkCredentials()) return alert('or clearly you don\'t! :O');
			if (this.debug) console.log('activateSettings');
			this.appItemsEl.hide();
			this.appItemsControlsEl.hide();
			this.appItemControlsEl.hide();
			this.appResultsEl.hide();
			this.appResultsControlsEl.hide();
			this.appFeedbackEl.hide();
			this.appFeedbackControlsEl.hide();
			this.appParentLimitEl.removeClass('small');
			this.appSettingsEl.children('h4').remove();
			this.appSettingsEl.children('.setting-site').remove();
			this.appSettingsEl.children('.livelist').remove();

			this.appTitleEl.html('Stillingar');
			this.appSettingsEl.show();
			this.appSettingsControlsEl.show();

			this.appSettingsEl.append($('<h4>').html('Síðan'));
			$.each(this.data.site,$.proxy(this.addSiteSetting,this));

			this.appSettingsEl.append($('<h4>').html('Orðalistinn'));
			this.appSettingsEl.append($('<div>').addClass('item-list livelist grid gutter collapse480'));
			$.each(this.data.livelist,$.proxy(this.addListItem,this));
		},

		addSiteSetting: function(index,item){
			var itemTitle = typeof item.title !== 'undefined' && item.title !== "" ? item.title : index;
			var itemValue = typeof item.value !== 'undefined' && item.value !== "" ? item.value : item;

			this.appTemplatesEl.find('.setting-site').clone().appendTo('.settings').find('label').html(itemTitle).siblings('input').attr('data-index',index).val(itemValue).on('change',$.proxy(function(e){
				var itemEl = $(e.currentTarget);
				var index = itemEl.attr('data-index');
				var value = itemEl.val();

				this.data.site[index].value = value;
			},this));
		},

		addListItem: function(index,item){
			this.appTemplatesEl.find('.setting-item').clone().appendTo('.livelist').find('input').val(item);
		},

		saveSettings: function(e){
			if (e) {
				e.preventDefault();
				var itemEl = $(e.currentTarget);
				if (itemEl.hasClass("disabled")) return;
			}
			$.ajax({
				url: 'json.php',
				type: 'POST',
				data: {json: JSON.stringify(this.data)},
				dataType: 'json'
			});
			this.updateSiteInfo();
			this.goBack();
		},

		feedback: function(e){
			if (e) {
				e.preventDefault();
				var itemEl = $(e.currentTarget);
				if (itemEl.hasClass("disabled")) return;
			}
			if (this.debug) console.log('feedback');
			this.appItemsEl.hide();
			this.appItemsControlsEl.hide();
			this.appItemControlsEl.hide();
			this.appResultsEl.hide();
			this.appResultsControlsEl.hide();
			this.appSettingsEl.hide();
			this.appSettingsControlsEl.hide();

			this.appTitleEl.html('Feedback');
			this.appFeedbackEl.show();
			this.appFeedbackControlsEl.show();

		},

		onResize: function(){
			if(this.doReset !== false);
				clearTimeout(this.doReset);
			this.doReset = setTimeout($.proxy(this.resizeFix,this), 750);
		},

		resizeFix: function(){
		},

		rand: function(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		},

		getBrowserInformation: function(){
			this.browser.isLegacy = $('.lt-ie9').length > 0;

			var agent = window.navigator.userAgent;
			var android = agent.indexOf('Android ');
			var ios = agent.indexOf('OS ');

			this.browser.standalone = window.navigator.standalone;

			this.browser.iosVersion = ios > -1 ? window.Number(agent.substr(ios + 3, 3).replace('_', '.')) : 0;
			this.browser.isIOS = this.browser.iosVersion > 0;
			this.browser.isIOS4 = this.browser.iosVersion > 4 && this.browser.iosVersion < 5;
			this.browser.isIOS5 = this.browser.iosVersion > 5 && this.browser.iosVersion < 6;
			this.browser.isIOS6 = this.browser.iosVersion > 6 && this.browser.iosVersion < 7;

			this.browser.androidVersion = android > -1 ? window.Number(agent.substr(android + 8, 3)) : 0;
			this.browser.isAndroid2 = this.browser.androidVersion === 2;

			this.browser.touch = $('html').hasClass('touch');
			this.browser.csstransitions = $('html').hasClass('csstransitions');
			this.browser.localstorage = $('html').hasClass('localstorage');
			this.browser.svg = $('html').hasClass('svg');
			this.browser.inlinesvg = $('html').hasClass('inlinesvg');
			this.browser.svgclippaths = $('html').hasClass('svgclippaths');
		}
	};

}(jQuery));

$(function(){
	var fundaflipp = new window.fundaflipp("html");
	if (fundaflipp.debug) console.log(fundaflipp);
});