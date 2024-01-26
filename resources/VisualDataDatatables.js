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
 * @copyright Copyright © 2021-2023, https://wikisphere.org
 */

/* eslint-disable no-unused-vars */

const VisualDataDatatables = function () {
	var cacheLimit = 40000;

	var getCacheKey = function ( obj ) {
		// @TODO
	};

	var callApi = function ( data, callback ) {
		// @TODO
	};

	return {
		getCacheKey,
		callApi,
		cacheLimit
	};
};

$( function () {
	var visualdataDatatables = new VisualDataDatatables();

	$( '.visualdata.datatable' ).each( function () {
		var preloadData = {};

		var table = $( this );
		var count = table.data( 'count' );
		var tableData = table.data();

		var conf = {
			pageLength: 20
		};
		$( this ).DataTable( conf );
	} );
} );
