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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with VisualData. If not, see <http://www.gnu.org/licenses/>.
 *
 * @file
 * @author thomas-topway-it <support@topway.it>
 * @copyright Copyright © 2024, https://wikisphere.org
 */

/* eslint-disable no-tabs */
/* eslint-disable no-unused-vars */

( function () {
	function init( $slide ) {
		$slide.slick( $slide.data().slick );
		$( '.slick-slider .slick-slide' ).each( function () {
			if ( $( this ).attr( 'data-url' ) ) {
				// $(this).attr('title', $(this).attr('data-title') )
				$( this ).css( 'cursor', 'pointer' );
				$( this ).click( function () {
					window.location = $( this ).attr( 'data-url' );
				} );
			}
		} );
	}

	$( '.slick-slider' ).each( function () {
		init( $( this ) );
	} );

}() );
