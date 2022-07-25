/*	Requires jQuery
*/

var donationsSummary = (function (window, document, undefined) {
	function donationsSummary() {
		var els, rgx, mch, tot, big, big_el, div_tot, div_rec, div_mos
		if (document.querySelectorAll) {
			els = document.querySelectorAll('#donations-received li')
			if (els) {
				div_tot = document.querySelector('#donations-received-total')
				div_big = document.querySelector('#donations-received-biggest')
				div_mos = document.querySelector('#donations-received-most-recent')

				rgx = /\d{1,3}\.\d{2}/

				// calc total and biggest
				tot    = 0.00
				big    = 0.00
				big_el = null
				for (var i = 0; i < els.length; ++i) {
					mch = els[i].innerHTML.match(rgx)
					if (mch && mch[0]) {
						mch[0] = +mch[0]
						tot += mch[0]
						if (mch[0] > big) {
							big = mch[0]
							big_el = els[i]
						}
					}
				}
				tot = tot.toFixed(2)
				big = big_el.innerHTML

				// show total
				if (div_tot) div_tot.innerHTML = '<strong>' + els.length + ' donations since 2010 totaling:</strong> $' + tot
				// grab biggest
				if (div_big) div_big.innerHTML = '<strong>Biggest donation:</strong> ' + big
				// grab most recent
				if (div_mos) div_mos.innerHTML = '<strong>Most recent donation:</strong> ' + els[0].innerHTML
			}
		}
	}
	return donationsSummary
}(this, this.document))

;$(function () {
	// record vote
	$('#feedback-vote input[name=vote]').click(function (evt) {
		var form, vote;
		form = $('#feedback-vote');
		vote = $('#feedback-vote input[name=vote]:checked').val();
		$('#feedback-vote > div > img').show();
		$.ajax({
			url  : form.attr('action'),
			type : form.attr('method'),
			data : {
				page : location.href,
				vote : vote
			},
			complete : function (data) {
				$('#feedback-vote > div > img').hide();
				$('#feedback-comment input[name=id]').val(data.responseText);
				$('#feedback-comment').show();
				if ('yes' === vote) {
					$('#feedback-donate').show({
						complete : function () {
							$.ajax({
								url : '/assets/php/donations-received.php',
								complete : function ( data ) {
									if (data && data.response) {
										$('#donations-received').html(data.response);
										if (donationsSummary) {
											donationsSummary();
										}
									}
								}
							});
						}
					});
				}
			}
		});
	});
	
	// record comment
	$('#feedback-comment').submit(function (evt) {
		var form;
		evt.preventDefault();
		form = $('#feedback-comment');
		$('#feedback-comment > div > img').show();
		$.ajax({
			url  : form.attr('action'),
			type : form.attr('method'),
			data : {
				id      : $('#feedback-comment input[name=id]').val(),
				comment : $('#feedback-comment textarea[name=comment]').val()
			},
			complete : function (data) {
				var donate, previous;
				donate   = $('#feedback-donate').clone(true);
				previous = $('#previous-comments').clone(true);
				$('#feedback-comment > div > img').hide();
				$('#feedback').html(data.responseText);
				$('#feedback')
					.append(donate)
					.append(previous)
				;
				$('#previous-comments').show();
			}
		});
	});
});
