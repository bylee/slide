( function() {
	escode = {};
	escode.coders = {};
	Model = escode.coders.Model = Backbone.Model.extend( {
	} );
	View = escode.coders.View = Backbone.View.extend( {
		template: function( model ) {
			var temp = this.defaultTemplate;
			if ( this.templateId ) {
				temp = $( this.templateId ).html();
				if ( !temp ) {
					temp = this.defaultTemplate;
				}
			}
			if ( !model ) {
				console.info( "No model" );
				return temp;
			}
			var result = Mustache.render( temp, model.toJSON() );
			console.info( "[DEBUG] Create template :%s", result );
			return result;
		}
	} );
	Collection = escode.coders.Collection = Backbone.Collection.extend( { } );


	Page = Model.extend( {
		initialize: function() {
			this.loaded = false;
		},
		parse: function( contents ) {
			console.info( "[ INFO] contents :" + contents );
			this.loaded = true;
			this.set( "contents", contents );
		}

	} );

	PageView = View.extend( {
		className: "step page",
		defaultTemplate: "{{contents}}",
		initialize: function() {
			_.bindAll( this );
			console.info( "Page( " + this.options.x + ", " + this.options.y + " ) added" );
			$( this.el ).attr( "data-x", this.options.x || 0 );
			$( this.el ).attr( "data-y", this.options.y || 0 );
			$( this.el ).html( this.model.get( "contents" ) );
			$( this.el ).on( "enterStep", this.enterPage );
		},
		render: function() {
			return this;
		},
		enterPage: function( e ) {
			this.model.slide.changePage( this.model );
		},
	} );


	Pages = Collection.extend( {
		model: Page,
	} );

	Slide = Model.extend( {
		initialize: function() {
			this.cover = new Page();
			this.cover.slide = this;
			this.pages = new Pages();
			_.bindAll( this );
			this.cover.bind( "change", this.update );
		},

		url: function() {
			return this.get( "url" );
		},

		parse: function( res ) {
			console.info( "[ INFO] Slide loaded" );
			that = this;
			this.pages.reset();

			this.cover.url = res.cover;
			this.cover.fetch( { dataType: "text" } );

			iPage = 1;
			_.each( res.pages, function( name ) {
				console.info( "[TRACE] Create " + name );
				page = new Page();
				page.url = name;

				page.fetch( {
					dataType: "text"
				} );
				page.slide = that;
				page.bind( "change", that.update );
				this.pages.add( page );
			}, this );

			delete res.pages;

			return res;
		},

		update: function() {
			if ( !this.cover.loaded ) {
				console.info( "Cover not loaded" );
				return ;
			}

			if ( this.pages.find( function( test ) {
				return !test.loaded;
			} ) ) {
				console.info( "Page not loaded" );
				return ;
			}
			this.trigger( "change" );
		},
		changePage: function( page ) {
			index = this.pages.indexOf( page );
			if ( index < 0 ) {
				document.title = this.get( "name" );
			} else {
				document.title = page.url + "(" + (index+1) + "/" + this.pages.length + ")"
			}
		}
	} );


	SlideView = View.extend( {
		initialize: function() {
			console.info( "SlideView init" );
			_.bindAll( this );
			$( document ).bind('keydown', this.onKeyDown );
			$( document ).bind('keyup', this.onKeyUp );
			this.model.bind( "change", this.render, this );
			this.model.fetch( { silent: true } );
		},

		addPage: function( pageView ) {
			$( this.el ).append( pageView.render().el );
		},

		render: function() {
			console.info( "[TRACE] Render :" + this.model.get( "name" ) );
			if ( this.model.get( "name" ) ) {
				document.title = this.model.get( "name" );
			}

			this.addPage( new PageView( { model: this.model.cover } ) );
			i = 1;
			this.model.pages.each( function( page ) {
				this.addPage( new PageView( { model: page, x: 1000*i } ) );
				i++;
			}, this );
			$( this.el ).jmpress();

			return this;
		},
		onKeyDown: function( e ) {
			if ( e.keyCode == 17 ) {
				this.enableEffect();
			} else {
				console.info( e.keyCode + " down" );
			}
		},

		onKeyUp: function( e ) {
			if ( e.keyCode == 17 ) {
				this.disableEffect();
			} else {
				console.info( e.keyCode + " up" );
			}
		},

		enableEffect: function() {
			if ( this.effect ) {
				return ;
			}
			$( this.el ).css( 'background-color: rgba( 0, 0, 0, 0.7 );position:fixed;' );

			console.log( "effect on" );
			this.effect = true;
		},

		disableEffect: function() {
			if ( !this.effect ) {
				return ;
			}
			this.effect = false;
		}
	} );

} ) ();
