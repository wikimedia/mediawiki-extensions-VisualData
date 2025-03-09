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
	'visualdataprint' => [ 0, 'vdataprint', 'visualdataprint' ],
	'visualdataquery' => [ 0, 'visualdataquery', 'vdataquery' ],
	'visualdataform' => [ 0, 'visualdataform', 'vdataform' ],
	'visualdatabutton' => [ 0, 'visualdatabutton', 'vdatabutton' ],
	'visualdataquerylink' => [ 0, 'visualdataquerylink', 'vdataquerylink', 'querylink' ],
	'visualdataqueryurl' => [ 0, 'visualdataqueryurl', 'vdataqueryurl', 'queryurl' ],
	'visualdatabase64encode' => [ 0, 'visualdatabase64encode', 'vdatabase64encode', 'base64encode' ],
	'visualdatabase64decode' => [ 0, 'visualdatabase64decode', 'vdatabase64decode', 'base64decode' ],
	'buttonlink' => [ 0, 'buttonlink', 'querybutton' ],

	// @credits https://www.mediawiki.org/wiki/Extension:Page_Forms
	'arraymap' => [ 0, 'arraymap' ],
	'arraymaptemplate' => [ 0, 'arraymaptemplate' ],
];
