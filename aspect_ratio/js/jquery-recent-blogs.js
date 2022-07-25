String.prototype.trim = function () {
	return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

// regex based partly on http://www.geekpedia.com/code20_Strip-HTML-using-JavaScript.html
String.prototype.sanitize = function () {
	return this.replace(/<[CDATA[/, '').replace(/]]>/, '').replace(/<(?:.|\s)*?>/g, '');
};

String.prototype.truncate = function (limit) {
	var bits;
	bits = this.split('');
	if (bits.length > limit) {
		for (var i = bits.length - 1; i > -1; --i) {
			if (i > limit) {
				bits.length = i;
			} else if (' ' === bits[i]) {
				bits.length = i;
				break;
			}
		}
		bits.push('&#8230;');
	}
	return bits.join('');
};

String.prototype.format = function () {
	var months, y, m, d, date, str;
	months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	// 0123456789
	// 2008-08-21
	y    = +this.substring(0, 4);
	m    = +this.substring(5, 7);
	d    = +this.substring(8, 10);
	date = new Date(y, m, d);
	str  = date.getDate() + ' ' + months[date.getMonth()] + ', ' + date.getFullYear();
	return str;
};

var BLOG;

BLOG = (function () {
	var _tmpl;
	_tmpl = [
		'<li><a href="', 0, '?ref=', 0, '" title="', 0, '">', 0, '</a> <em>', 0, '</em></li>'
	];
	return {
		init: function () {
			$.ajax({
				url     : '/blog/rss.xml',
				type    : 'GET',
				success : function (xml) {
					var html;
					html  = '<div class="segdeha-blog"><h3>Recently on <a href="http://andrew.hedges.name/blog/?ref=';
					html += location.pathname;
					html += '">andrew.<wbr>hedges.<wbr>name/<wbr>blog</a>&#8230;</h3><ul>';
					$.each($('item', xml), function (idx, val) {
						_tmpl[1] = this.getElementsByTagName('link')[0].firstChild.nodeValue.trim();
						_tmpl[3] = location.pathname;
						_tmpl[5] = this.getElementsByTagName('description')[0].firstChild.nodeValue.trim().sanitize().truncate(100);
						_tmpl[7] = this.getElementsByTagName('title')[0].firstChild.nodeValue.trim();
						_tmpl[9] = '';
						html += _tmpl.join('');
						if (idx > 8) return false;
					});
					html += '</ul></div>';
					$('#segdeha-blog').after(html);
				},
				error : function (xhr, type) {
					// IE doesn't like my RSS for some reason
				}
			});
		}
	};
})();

// BLOG.init();
