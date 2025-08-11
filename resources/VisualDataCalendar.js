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
				event.resourcesIds = [];
				for ( var i in event.resources ) {
					resources.push( { id: i, title: event.resources[ i ] } );
					event.resourcesIds.push( i );
				}
			}
		}

		if ( resources.length ) {
			var additionalButtons = [];
			var resourceTimeGridWeekFound = false;
			for ( var i in params.headerToolbar ) {
				if ( params.headerToolbar[ i ].indexOf( 'resourceTimeGridWeek' ) !== -1 ) {
					resourceTimeGridWeekFound = true;
				}
			}

			if ( !resourceTimeGridWeekFound ) {
				additionalButtons.push( 'resourceTimeGridWeek' );
			}

			var resourceTimelineWeekFound = false;
			for ( var i in params.headerToolbar ) {
				if ( params.headerToolbar[ i ].indexOf( 'resourceTimelineWeek' ) !== -1 ) {
					resourceTimelineWeekFound = true;
				}
			}

			if ( !resourceTimelineWeekFound ) {
				additionalButtons.push( 'resourceTimelineWeek' );
			}

			if ( !resourceTimeGridWeekFound || !resourceTimelineWeekFound ) {
				params.headerToolbar.end += ' ' + additionalButtons.join( ',' );
			}
		}

		const ec = EventCalendar.create( element, $.extend( params, {
			events: json.map( ( x ) => x[ 1 ] ),
			resources,
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
