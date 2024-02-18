<?php

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
 * along with VisualData.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @file
 * @ingroup extensions
 * @author thomas-topway-it <support@topway.it>
 * @copyright Copyright ©2024, https://wikisphere.org
 */

$magicWords = [];

// see here
// https://www.mediawiki.org/wiki/Manual:Magic_words
// '0' stands for 'case insensitive'

$magicWords['en'] = [
	'visualdataprint' => [ 0, 'visualdataprint' ],
	'visualdataquery' => [ 0, 'visualdataquery' ],
	'visualdataform' => [ 0, 'visualdataform' ],
	'visualdatabutton' => [ 0, 'visualdatabutton' ],
	'vdataprint' => [ 0, 'visualdataprint' ],
	'vdataquery' => [ 0, 'visualdataquery' ],
	'vdataform' => [ 0, 'visualdataform' ],
	'vdatabutton' => [ 0, 'visualdatabutton' ]
];
