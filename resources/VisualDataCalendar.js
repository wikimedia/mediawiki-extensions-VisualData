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

		const ec = EventCalendar.create( element, {
			selectable: true,
			events: json.map( ( x ) => x[ 1 ] ),
			dateClick: function ( info ) {
				// console.log( info );
			},
			select: function ( info ) {
				// console.log( info );
			}
		} );
	}

	$( '.visualdata-calendar' ).each( function () {
		init( $( this ) );
	} );
} );
