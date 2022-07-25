// create prompts in the UI to guide the user
(function ( window, document, undefined ) {
	// simple templates https://gist.github.com/segdeha/b73384e01c48c002c1bd
	function Template(str) {
		this.rgx = /{{([^{}]*)}}/g
		this.str = str || ''
	}

	Template.prototype.evaluate = function (vals) {
		vals = vals || {}
		function repr(str, match) {
			return 'string' === typeof vals[match] || 'number' === typeof vals[match] ? vals[match] : str
		}
		return this.str.replace(this.rgx, repr)
	}

	/**
	 * Constructor
	 * @param {DOM Element} parent Element inside which we'll create the prompter element
	 * @return {Prompter}
	 */
	function Prompter( parent ) {
		if ( !parent ) {
			throw 'No parent element specified'
		}

		this.parent = parent

		this.id        = parent.dataset.promptId // these attrs resolve to `undefined` if not present
		this.text      = parent.dataset.promptText
		this.delay     = parent.dataset.promptDelay || 2000 // default to showing after 2s
		this.hideDelay = parent.dataset.promptHideDelay
		this.display   = parent.dataset.promptDisplay || 'once' // enum: 'once', 'always', [another prompt’s id]

		parent.classList.add( 'prompt-parent' )

		// create the prompter
		this.create()
	}

	var proto = Prompter.prototype

	proto.create = function () {
		// create element HTML string
		var tmpl = new Template( '<span id="{{id}}" class="prompt">{{text}}</span>' )
		var html = tmpl.evaluate({
			id   : this.id,
			text : this.text
		})
		this.activate( html )
	}

	proto.canShow = function () {
		var canShow = true
		if ( 'once' === this.display && window.localStorage[ this.id ] ) {
			canShow = false
		}
		// prompt wants another prompt to control its display
		if ( 'once' !== this.display && 'always' !== this.display ) {
			if ( window.localStorage[ this.display ] ) {
				canShow = false
			}
		}
		return canShow
	}

	proto.activate = function ( html ) {
		// check for localStorage saying we shouldn't show it again
		if ( !this.canShow() ) {
			return // already shown it
		}

		this.parent.insertAdjacentHTML( 'beforeend', html )
		this.prompt = document.getElementById( this.id )

		window.addEventListener('click', function ( evt ) {
			// clicking on the prompt or its parent closes it
			if ( evt.target === this.parent || evt.target === this.prompt ) {
				this.deactivate()
			}
		}.bind( this ))

		// add other events to the parent element
		this.parent.querySelector('input,select,textarea').addEventListener('focus', this.deactivate.bind( this ))

		// user may interact with the parent element before we want to show the prompt
		if ( !window.localStorage[ this.id ] ) {
			setTimeout(function () {
				this.prompt.classList.add( 'show' )
				if ( this.hideDelay ) {
					setTimeout(function () {
						this.prompt.classList.remove( 'show' )
					}.bind( this ), this.hideDelay)
				}
			}.bind( this ), this.delay )
		}
	}

	proto.deactivate = function ( evt ) {
		this.prompt.classList.remove( 'show' )
		if ( 'once' === this.display ) {
			window.localStorage[ this.id ] = 'once'
		}
		// if another prompt is the controller, mark it as shown
		else if ( 'always' !== this.display ) {
			window.localStorage[ this.display ] = 'once'
		}
	}

	function addCSS( callback ) {
		var link = document.createElement( 'link' )
		link.onload = callback
		link.rel = 'stylesheet'
		link.href = 'http://segdeha.com/assets/css/prompter.css'
		document.getElementsByTagName( 'head' )[ 0 ].appendChild( link )
	}

	function init() {
		function callback() {
			var els = document.querySelectorAll('[data-prompt-text]')
			var prompters = []
			for ( var i = 0; i < els.length; ++i ) {
				prompters.push( new Prompter( els[ i ] ) )
			}
		}
		addCSS( callback )
	}

	document.addEventListener( 'DOMContentLoaded', init )

}).call( this, this, this.document )
