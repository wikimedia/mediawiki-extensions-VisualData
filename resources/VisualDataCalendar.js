/**
 * This file is part of the MediaWiki extension VisualData.
 *
 * VisualData is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * VisualData is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with VisualData. If not, see <http://www.gnu.org/licenses/>.
 *
 * @file
 * @author thomas-topway-it <support@topway.it>
 * @copyright Copyright ©2025, https://wikisphere.org
 */

/* eslint-disable no-unused-vars */

$( function () {
	function init( $el ) {
		var element = $el.get( 0 );
		var data = $el.data();
		var json = data.json;
		var params = data.params;

		if ( !params.date ) {
			params.date = new Date().toISOString();

		} else {
			var dateObj = new Date( params.date * 1000 );
			params.date = dateObj.toISOString();
		}

		// ***temporary solution, ensure the values of the following keys
		// are consistent to the selected view
		// @see https://github.com/vkurko/calendar/tree/master
		var overrides = [
			'buttonText',
			'dayHeaderAriaLabelFormat',
			'dayHeaderFormat',
			'displayEventEnd',
			'duration',
			'slotDuration',
			'theme',
			'titleFormat'
		];

		for ( var key of overrides ) {
			delete params[ key ];
		}

		// handle resources
		var resources = [];
		for ( var value of json ) {
			var event = value[ 1 ];
			if ( 'resources' in event ) {
				event.resourceIds = [];
				if ( Array.isArray( event.resources ) ) {
					for ( var resource of event.resources ) {
						if ( !VisualDataFunctions.inArray( resource, resources ) ) {
							resources.push( resource );
						}
						event.resourceIds.push( resources.indexOf( resource ) );
					}
				} else {
					if ( !VisualDataFunctions.inArray( event.resources, resources ) ) {
						resources.push( event.resources );
					}
					event.resourceIds.push( resources.indexOf( event.resources ) );
				}
			}
			if ( !event.end ) {
				// eslint-disable-next-line no-underscore-dangle
				var dateObj_ = new Date( event.start );
				var durationMinutes = ( event.duration ? event.duration : params[ 'default-event-duration' ] ) * 1;
				dateObj_.setMinutes( dateObj_.getMinutes() + durationMinutes );
				event.end = dateObj_;
			}

			// convert to local
			for ( var prop of [ 'start', 'end' ] ) {
				event[ prop ] = dayjs.utc( event[ prop ] ).local().toDate();
			}
		}

		if ( resources.length ) {
			var additionalButtons = [];
			var relatedViews = [ 'resourceTimeGridWeek', 'resourceTimelineWeek' ];

			// eslint-disable-next-line no-underscore-dangle
			for ( var view_ of relatedViews ) {
				// eslint-disable-next-line no-underscore-dangle
				var found_ = false;
				for ( var i in params.headerToolbar ) {
					if ( params.headerToolbar[ i ].includes( view_ ) ) {
						found_ = true;
						break;
					}
				}

				if ( !found_ ) {
					additionalButtons.push( view_ );
				}
			}

			if ( additionalButtons.length ) {
				params.headerToolbar.end += ' ' + additionalButtons.join( ',' );
			}
		}

		// remove placeholder
		$el.text( '' );

		const ec = EventCalendar.create( element, $.extend( params, {
			events: json.map( ( x ) => x[ 1 ] ),
			resources: resources.map( ( x, j ) => {
				return { id: j, title: x };
			} ),
			dateClick: function ( info ) {
				// console.log( info );
			},
			select: function ( info ) {
				// console.log( info );
			}
		} ) );

	}

	$( '.visualdata-calendar' ).each( function () {
		init( $( this ) );
	} );
} );
