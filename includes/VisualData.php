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
 * @copyright Copyright ©2021-2024, https://wikisphere.org
 */

if ( is_readable( __DIR__ . '/../vendor/autoload.php' ) ) {
	include_once __DIR__ . '/../vendor/autoload.php';
}

use MediaWiki\Extension\VisualData\DatabaseManager;
use MediaWiki\Extension\VisualData\QueryProcessor;
use MediaWiki\Extension\VisualData\SchemaProcessor;
use MediaWiki\Logger\LoggerFactory;
use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\SlotRecord;
use Swaggest\JsonDiff\JsonPointer;

class VisualData {
	/** @var array */
	protected static $cachedJsonData = [];

	/** @var User */
	public static $User;

	/** @var UserGroupManager */
	private static $userGroupManager;

	/** @var array */
	private static $slotsCache = [];

	/** @var array */
	public static $schemas = [];

	/** @var array */
	public static $queries = [];

	/** @var array */
	public static $pageForms = [];

	/** @var array */
	public static $pageButtons = [];

	/** @var Logger */
	public static $Logger;

	/** @var int */
	public static $queryLimit = 500;

	/** @var SchemaProcessor */
	public static $schemaProcessor;

		/** @var array */
	public static $QueryLinkDefaultParameters = [
		// 'class' => [
		// 	'label' => 'visualdata-parserfunction-querylink-class-label',
		// 	'description' => 'visualdata-parserfunction-querylink-class-description',
		// 	'type' => 'string',
		// 	'required' => false,
		// 	'default' => '',
		// 	'example' => 'visualdata-parserfunction-querylink-class-example'
		// ],
		'class-attr-name' => [
			'label' => 'visualdata-parserfunction-querylink-class-attr-name-label',
			'description' => 'visualdata-parserfunction-querylink-class-attr-name-description',
			'type' => 'string',
			'required' => false,
			'default' => 'class',
			'example' => 'visualdata-parserfunction-querylink-class-attr-name-example'
		],
	];

	/** @var array */
	public static $ButtonDefaultParameters = [
		'label' => [
			'label' => 'visualdata-parserfunction-button-label-label',
			'description' => 'visualdata-parserfunction-button-label-description',
			'type' => 'string',
			'required' => true,
			'default' => '',
			'example' => 'visualdata-parserfunction-button-label-example'
		],
		'value' => [
			'label' => 'visualdata-parserfunction-button-value-label',
			'description' => 'visualdata-parserfunction-button-value-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-button-value-example'
		],
		'callback' => [
			'label' => 'visualdata-parserfunction-button-callback-label',
			'description' => 'visualdata-parserfunction-button-callback-description',
			'type' => 'string',
			'required' => true,
			'default' => '',
			'example' => 'visualdata-parserfunction-button-callback-example'
		],
		'schema' => [
			'label' => 'visualdata-parserfunction-button-schema-label',
			'description' => 'visualdata-parserfunction-button-schema-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-button-schema-example'
		],
		'edit-page' => [
			'label' => 'visualdata-parserfunction-form-edit-page-label',
			'description' => 'visualdata-parserfunction-form-edit-page-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-edit-page-example'
		],
		'target-slot' => [
			'label' => 'visualdata-parserfunction-form-target-slot-label',
			'description' => 'visualdata-parserfunction-form-target-slot-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-target-slot-example'
		],
		'icon' => [
			'label' => 'visualdata-parserfunction-button-icon-label',
			'description' => 'visualdata-parserfunction-button-icon-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-button-icon-example'
		]
	];

	/** @var array */
	public static $FormDefaultParameters = [
		'schemas' => [
			'label' => 'visualdata-parserfunction-form-schemas-label',
			'description' => 'visualdata-parserfunction-form-schemas-description',
			'type' => 'string',
			'required' => true,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-schemas-example'
		],
		'title' => [
			'label' => 'visualdata-parserfunction-form-title-label',
			'description' => 'visualdata-parserfunction-form-title-description',
			'type' => 'string',
			'required' => true,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-title-example'
		],
		'action' => [
			'label' => 'visualdata-parserfunction-form-action-label',
			'description' => 'visualdata-parserfunction-form-action-description',
			'type' => 'string',
			'required' => true,
			'default' => 'create',
			'example' => 'visualdata-parserfunction-form-action-example'
		],
		'overwrite-existing-article-on-create' => [
			'label' => 'visualdata-parserfunction-form-overwrite-existing-article-on-create-label',
			'description' => 'visualdata-parserfunction-form-overwrite-existing-article-on-create-description',
			'type' => 'boolean',
			'required' => false,
			'default' => false,
			'example' => 'visualdata-parserfunction-form-overwrite-existing-article-on-create-example'
		],
		'view' => [
			'label' => 'visualdata-parserfunction-form-view-label',
			'description' => 'visualdata-parserfunction-form-view-description',
			'type' => 'string',
			'required' => true,
			'default' => 'inline',
			'example' => 'visualdata-parserfunction-form-view-example'
		],
		'layout' => [
			'label' => 'visualdata-parserfunction-form-layout-label',
			'description' => 'visualdata-parserfunction-form-layout-description',
			'type' => 'string',
			'required' => true,
			'default' => 'tabs',
			'example' => 'visualdata-parserfunction-form-layout-example'
		],
		'callback' => [
			'label' => 'visualdata-parserfunction-form-callback-label',
			'description' => 'visualdata-parserfunction-form-callback-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-callback-example'
		],
		'edit-page' => [
			'label' => 'visualdata-parserfunction-form-edit-page-label',
			'description' => 'visualdata-parserfunction-form-edit-page-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-edit-page-example'
		],
		'preload' => [
			'label' => 'visualdata-parserfunction-form-preload-label',
			'description' => 'visualdata-parserfunction-form-preload-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-preload-example'
		],
		'preload-data' => [
			'label' => 'visualdata-parserfunction-form-preload-data-label',
			'description' => 'visualdata-parserfunction-form-preload-data-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-preload-data-example'
		],
		'return-page' => [
			'label' => 'visualdata-parserfunction-form-return-page-label',
			'description' => 'visualdata-parserfunction-form-return-page-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-return-page-example'
		],
		'return-url' => [
			'label' => 'visualdata-parserfunction-form-return-url-label',
			'description' => 'visualdata-parserfunction-form-return-url-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-return-url-example'
		],
		'popup-size' => [
			'label' => 'visualdata-parserfunction-form-popup-size-label',
			'description' => 'visualdata-parserfunction-form-popup-size-description',
			'type' => 'string',
			'required' => false,
			'default' => 'medium',
			'example' => 'visualdata-parserfunction-form-popup-size-example'
		],
		'css-class' => [
			'label' => 'visualdata-parserfunction-form-css-class-label',
			'description' => 'visualdata-parserfunction-form-css-class-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-css-class-example'
		],
		'pagename-formula' => [
			'label' => 'visualdata-parserfunction-form-pagename-formula-label',
			'description' => 'visualdata-parserfunction-form-pagename-formula-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-pagename-formula-example'
		],
		'edit-freetext' => [
			'label' => 'visualdata-parserfunction-form-edit-freetext-label',
			'description' => 'visualdata-parserfunction-form-edit-freetext-description',
			'type' => 'boolean',
			'required' => false,
			'default' => '0',
			'example' => 'visualdata-parserfunction-form-edit-freetext-example'
		],
		'edit-categories' => [
			'label' => 'visualdata-parserfunction-form-edit-categories-label',
			'description' => 'visualdata-parserfunction-form-edit-categories-description',
			'type' => 'boolean',
			'required' => false,
			'default' => '0',
			'example' => 'visualdata-parserfunction-form-edit-categories-example'
		],
		'edit-content-model' => [
			'label' => 'visualdata-parserfunction-form-edit-content-model-label',
			'description' => 'visualdata-parserfunction-form-edit-content-model-description',
			'type' => 'boolean',
			'required' => false,
			'default' => '0',
			'example' => 'visualdata-parserfunction-form-edit-content-model-example'
		],
		'target-slot' => [
			'label' => 'visualdata-parserfunction-form-target-slot-label',
			'description' => 'visualdata-parserfunction-form-target-slot-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-target-slot-example'
		],
		'edit-target-slot' => [
			'label' => 'visualdata-parserfunction-form-edit-target-slot-label',
			'description' => 'visualdata-parserfunction-form-edit-target-slot-description',
			'type' => 'boolean',
			'required' => false,
			'default' => '0',
			'example' => 'visualdata-parserfunction-form-edit-target-slot-example'
		],
		'default-categories' => [
			'label' => 'visualdata-parserfunction-form-default-categories-label',
			'description' => 'visualdata-parserfunction-form-default-categories-description',
			'type' => 'array',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-form-default-categories-example'
		],
		'default-content-model' => [
			'label' => 'visualdata-parserfunction-form-default-content-model-label',
			'description' => 'visualdata-parserfunction-form-default-content-model-description',
			'type' => 'string',
			'required' => false,
			'default' => 'wikitext',
			'example' => 'visualdata-parserfunction-form-default-content-model-example'
		],
		'layout-align' => [
			'label' => 'visualdata-parserfunction-form-layout-align-label',
			'description' => 'visualdata-parserfunction-form-layout-align-description',
			'type' => 'string',
			'required' => false,
			'default' => 'top',
			'example' => 'visualdata-parserfunction-form-layout-align-example'
		],
		'popup-help' => [
			'label' => 'visualdata-parserfunction-form-popup-help-label',
			'description' => 'visualdata-parserfunction-form-popup-help-description',
			'type' => 'boolean',
			'required' => false,
			'default' => '0',
			'example' => 'visualdata-parserfunction-form-popup-help-example'
		],
		'submit-button-text' => [
			'label' => 'visualdata-parserfunction-form-submit-button-text-label',
			'description' => 'visualdata-parserfunction-form-submit-button-text-description',
			'type' => 'string',
			'required' => false,
			'default' => 'submit',
			'example' => 'visualdata-parserfunction-form-submit-button-text-example'
		],
		'validate-button-text' => [
			'label' => 'visualdata-parserfunction-form-validate-button-text-label',
			'description' => 'visualdata-parserfunction-form-validate-button-text-description',
			'type' => 'string',
			'required' => false,
			'default' => 'validate',
			'example' => 'visualdata-parserfunction-form-validate-button-text-example'
		]
	];

	/** @var array */
	public static $QueryDefaultParameters = [
		'schema' => [
			'label' => 'visualdata-parserfunction-query-schema-label',
			'description' => 'visualdata-parserfunction-query-schema-description',
			'type' => 'string',
			'required' => true,
			'default' => '',
			'example' => 'visualdata-parserfunction-query-schema-example'
		],
		'separator' => [
			'label' => 'visualdata-parserfunction-query-separator-label',
			'description' => 'visualdata-parserfunction-query-separator-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-query-separator-example'
		],
		'values-separator' => [
			'label' => 'visualdata-parserfunction-query-values-separator-label',
			'description' => 'visualdata-parserfunction-query-values-separator-description',
			'type' => 'string',
			'required' => false,
			'default' => ', ',
			'example' => 'visualdata-parserfunction-query-values-separator-example'
		],
		'template' => [
			'label' => 'visualdata-parserfunction-query-template-label',
			'description' => 'visualdata-parserfunction-query-template-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-query-template-example'
		],
		'module' => [
			'label' => 'visualdata-parserfunction-query-module-label',
			'description' => 'visualdata-parserfunction-query-module-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-query-module-example'
		],
		'limit' => [
			'label' => 'visualdata-parserfunction-query-limit-label',
			'description' => 'visualdata-parserfunction-query-limit-description',
			'type' => 'integer',
			'required' => false,
			'default' => '100',
			'example' => 'visualdata-parserfunction-query-limit-example'
		],
		'offset' => [
			'label' => 'visualdata-parserfunction-query-offset-label',
			'description' => 'visualdata-parserfunction-query-offset-description',
			'type' => 'integer',
			'required' => false,
			'default' => '0',
			'example' => 'visualdata-parserfunction-query-offset-example'
		],
		'order' => [
			'label' => 'visualdata-parserfunction-query-order-label',
			'description' => 'visualdata-parserfunction-query-order-description',
			'type' => 'string',
			'required' => false,
			'default' => '',
			'example' => 'visualdata-parserfunction-query-order-example'
		],
		'format' => [
			'label' => 'visualdata-parserfunction-query-format-label',
			'description' => 'visualdata-parserfunction-query-format-description',
			'type' => 'string',
			'required' => true,
			'default' => '',
			'example' => 'visualdata-parserfunction-query-format-example'
		],
		'pagetitle' => [
			'label' => 'visualdata-parserfunction-query-pagetitle-label',
			'description' => 'visualdata-parserfunction-query-pagetitle-description',
			'type' => 'string',
			'required' => false,
			'default' => 'page title',
			'example' => 'visualdata-parserfunction-query-pagetitle-example'
		],
	];

	/**
	 * @return void
	 */
	public static function initialize() {
		self::$Logger = LoggerFactory::getInstance( 'VisualData' );
		self::$User = RequestContext::getMain()->getUser();
		self::$userGroupManager = MediaWikiServices::getInstance()->getUserGroupManager();
		// self::$schemaProcessor = new SchemaProcessor();
	}

	/**
	 * @param string $pageName
	 * @param array $value
	 * @return array
	 */
	public static function createTemplateContent( $pageName, $value ) {
		$mapDescription = [
			'VisualDataForm' => 'visualdata-parserfunction-form-description',
			// 'VisualDataQuery' => 'visualdata-parserfunction-query-description',
			'VisualDataButton' => 'visualdata-parserfunction-button-description',
			'VisualDataPrint' => 'visualdata-parserfunction-print-description'
		];

		$ret = "<noinclude>
<pre>
{{{$pageName}
";

		foreach ( $value as $key => $values ) {
			$ret .= "|$key = \n";
		}

		$ret .= '}}
</pre>

';

		$ret .= wfMessage( 'visualdata-parserfunction-template-notice-visual-editor-newlines' )->parse();

		$ret .= '
<templatedata>
';

		$params = [];
		foreach ( $value as $key => $values ) {
			$values['label'] = wfMessage( $values['label'] )->text();
			$values['description'] = wfMessage( $values['description'] )->text();
			$values['example'] = wfMessage( $values['example'] )->text();

			if ( $values['type'] === 'integer' ) {
				$values['type'] = 'number';
			}

			if ( $values['type'] === 'array' ) {
				$values['type'] = 'string';
				$values['default'] = '';
			}

			$params[$key] = $values;
		}

		$json = [
			'description' => wfMessage( $mapDescription[$pageName] )->text(),
			'params' => $params
		];

		$ret .= json_encode( $json, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );

		$ret .= '
</templatedata>
</noinclude>
<includeonly>{{#' . strtolower( $pageName ) . ':';

		$ret .= '{{{' . key( $value ) . '}}}';
		array_shift( $value );

		foreach ( $value as $key => $values ) {
			if ( empty( $values['default'] ) ) {
				$values['default'] = '';
			}
			$ret .= "|$key = {{{{$key}|{$values['default']}}}}";
		}

		$ret .= ' }}
</includeonly>
';

		return $ret;
	}

	/**
	 * @param Parser $parser
	 * @param mixed ...$argv
	 * @return array
	 */
	public static function parserFunctionButton( Parser $parser, ...$argv ) {
/*
{{#visualdatabutton: Get folders
|callback = ContactManager.formAction
}}
*/
		$argv[] = 'function=button';

		return self::parserFunctionForm( $parser, ...$argv );
	}

	/**
	 * @param Parser $parser
	 * @param mixed ...$argv
	 * @return array
	 */
	public static function parserFunctionQueryLink( Parser $parser, ...$argv ) {
		$parserOutput = $parser->getOutput();

/*
{{#querylink: pagename
|label
|class=
|class-attr-name=class
|a=b
|c=d
|...
}}
*/
		// unnamed parameters, recognized options,
		// named parameters
		[ $values, $options, $query ] = self::parseParameters( $argv, array_keys( self::$QueryLinkDefaultParameters ) );

		$defaultParameters = self::$QueryLinkDefaultParameters;

		array_walk( $defaultParameters, static function ( &$value, $key ) {
			$value = [ $value['default'], $value['type'] ];
		} );

		$options = self::applyDefaultParams( $defaultParameters, $options );

		if ( !count( $values ) || empty( $values[0] ) ) {
			return 'no page name';
		}

		// assign the indicated name for the "class" attribute
		// to the known options (from the unknown named parameters)
		if ( isset( $query[$options['class-attr-name']] ) ) {
			$options[$options['class-attr-name']] = $query[$options['class-attr-name']];
		}
		unset( $query[$options['class-attr-name']] );

		if ( !count( $query ) ) {
			return 'no query';
		}

		$title_ = Title::newFromText( $values[0] );
		$text = ( !empty( $values[1] ) ? $values[1]
			: $title_->getText() );

		$attr = [];
		if ( !empty( $options[$options['class-attr-name']] ) ) {
			$attr['class'] = $options[$options['class-attr-name']];
		}

		// *** alternatively use $linkRenderer->makePreloadedLink
		// or $GLOBALS['wgArticlePath'] and wfAppendQuery
		$ret = Linker::link( $title_, $text, $attr, $query );

		return [
			$ret,
			'noparse' => true,
			'isHTML' => true
		];
	}

	/**
	 * @param Parser $parser
	 * @param mixed ...$argv
	 * @return array
	 */
	public static function parserFunctionQueryUrl( Parser $parser, ...$argv ) {
		$parserOutput = $parser->getOutput();

/*
{{#querylink: pagename
|a=b
|c=d
|...
}}
*/
		// unnamed parameters, recognized options,
		// named parameters
		[ $values, $options, $query ] = self::parseParameters( $argv );

		if ( !count( $values ) || empty( $values[0] ) ) {
			return 'no page name';
		}

		if ( !count( $query ) ) {
			return 'no query';
		}

		$title_ = Title::newFromText( $values[0] );
		$url = $title_->getLinkURL( $query );

		$url = wfAppendQuery( $url, $query );

		return [
			$url,
			'noparse' => true,
			'isHTML' => true
		];
	}

	/**
	 * @param Parser $parser
	 * @param mixed ...$argv
	 * @return array
	 */
	public static function parserFunctionBase64Encode( Parser $parser, ...$argv ) {
		$parserOutput = $parser->getOutput();
		return [
			base64_encode( $argv[0] ),
			'noparse' => true,
			'isHTML' => false
		];
	}

	/**
	 * @param Parser $parser
	 * @param mixed ...$argv
	 * @return array
	 */
	public static function parserFunctionBase64Decode( Parser $parser, ...$argv ) {
		$parserOutput = $parser->getOutput();
		return [
			base64_decode( $argv[0] ),
			'noparse' => true,
			'isHTML' => false
		];
	}

	/**
	 * @param Parser $parser
	 * @param mixed ...$argv
	 * @return array
	 */
	public static function parserFunctionForm( Parser $parser, ...$argv ) {
		$parserOutput = $parser->getOutput();
		$parserOutput->setExtensionData( 'visualdataform', true );

		$isButton = in_array( 'function=button', $argv );
		$function = ( $isButton ? 'button' : 'form' );

		$parser->addTrackingCategory( "visualdata-trackingcategory-parserfunction-$function" );

		$title = $parser->getTitle();

/*
{{#visualdataform: Form a
|title =
|action = create / edit
|return-page =
|edit-page = [page to edit]
|view = inline / popup
|popup-size = medium / larger
|css-class =
|pagename=formula =
|edit-freetext = true / false
|edit-categories = true / false
|edit-content-model = true / false
|default-categories =
|default-content-model = wikitext / ...
|layout-align = top / left / right / inline
|popup-help = true / false
|submit-button-text =
|layout = stacked / booklet / tabs / steps
|email-to =
|navigation-next =
|navigation-back =
|show-progress =
}}
*/
		$defaultParameters = self::$FormDefaultParameters;

		if ( $isButton ) {
			$defaultParameters = array_merge( $defaultParameters, self::$ButtonDefaultParameters );
		}

		array_walk( $defaultParameters, static function ( &$value, $key ) {
			$value = [ $value['default'], $value['type'] ];
		} );

		[ $values, $options, $unknownNamed ] = self::parseParameters( $argv, array_keys( $defaultParameters ) );

		if ( !count( $values ) || empty( $values[0] ) ) {
			return ( !$isButton ? 'no schemas' : 'no label' );
		}

		// @see https://wikisphere.org/wiki/User:Filburt/Nested_Schemas_and_Templates_Example
		// @see https://www.mediawiki.org/wiki/Extension_talk:VisualData
		$preloadDataOverride = [];

		foreach ( $unknownNamed as $key => $val ) {
			if ( strpos( $key, 'preload-data?' ) === 0 ) {
				// *** attention !! (.+)$ may contain an = symbol
				if ( preg_match( '/^preload-data(\?(.+?))?=(.+)$/', "$key=$val", $match ) ) {
					[ $field_, $option_ ] = explode( '+', $match[2] ) + [ null, null ];
					switch ( $option_ ) {
						case 'base64':
							$match[3] = base64_decode( $match[3] );
							break;
					}
					$preloadDataOverride[$field_] = $match[3];
				}
			}
		}

		$params = self::applyDefaultParams( $defaultParameters, $options );
		$params['preload-data-override'] = $preloadDataOverride;

		if ( $isButton ) {
			$params['label'] = $values[0];
			$params['action'] = 'edit';
			$params['view'] = 'button';
			$params['edit-categories'] = false;
			$params['edit-freetext'] = false;
			$params['return-page'] = $title->getFullText();
		}

		$databaseManager = new DatabaseManager();

		if ( !$isButton ) {
			$schemas = preg_split( '/\s*,\s*/', $values[0], -1, PREG_SPLIT_NO_EMPTY );
		} else {
			$schemas = ( !empty( $params['schema'] ) ? [ $params['schema'] ] : [] );
		}

		$schemas = array_filter( $schemas, static function ( $val ) use( $databaseManager ) {
			return $databaseManager->schemaExists( $val );
		} );

		self::$pageForms[] = [
			'schemas' => $schemas,
			'options' => $params
		];

		$parserOutput->setExtensionData( 'visualdataforms', self::$pageForms );

		$spinner = Html::rawElement(
			'div',
			[ 'class' => 'mw-rcfilters-spinner mw-rcfilters-spinner-inline', 'style' => 'display:none' ],
			Html::element(
				'div',
				[ 'class' => 'mw-rcfilters-spinner-bounce' ]
			)
		);

		// @TODO display client-side ?
		$errorMessage = '';
		if ( count( $preloadDataOverride ) && !class_exists( 'Swaggest\JsonDiff\JsonPointer' ) ) {
			$errorMessage = wfMessage( 'visualdata-jsmodule-missing-json-diff-library-preload-data' )->text();
		}

		if ( !empty( $errorMessage ) ) {
			$errorMessage = '<div style="color:red;font-weight:bold">' . $errorMessage . '</div>';
		}

		if ( !$isButton ) {
			return [
				// . $spinner
				$errorMessage
				. '<div class="VisualDataFormWrapper" id="visualdataform-wrapper-' . ( count( self::$pageForms ) - 1 ) . '">'
					. wfMessage( 'visualdata-parserfunction-form-placeholder' )->text() . '</div>',
				'noparse' => true,
				'isHTML' => true
			];
		}

		return [
			$errorMessage
			. '<div class="VisualDataButton" id="visualdataform-wrapper-' . ( count( self::$pageForms ) - 1 ) . '">'
				. wfMessage( "visualdata-parserfunction-$function-placeholder" )->text() . '</div>',
			'noparse' => true,
			'isHTML' => true
		];
	}

	/**
	 * @param array $defaultParams
	 * @param array $params
	 * @return array
	 */
	public static function applyDefaultParams( $defaultParams, $params ) {
		$ret = [];
		foreach ( $defaultParams as $key => $value ) {
			[ $defaultValue, $type ] = $value;
			$val = $defaultValue;
			if ( array_key_exists( $key, $params ) ) {
				$val = $params[$key];
			}

			switch ( $type ) {
				case 'bool':
				case 'boolean':
					$val = filter_var( $val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );
					if ( $val === null ) {
						$val = filter_var( $defaultValue, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );
					}
					settype( $val, 'bool' );
					break;

				case 'array':
					$val = array_filter(
						preg_split( '/\s*,\s*/', $val, -1, PREG_SPLIT_NO_EMPTY ) );
					break;

				case 'number':
					$val = filter_var( $val, FILTER_VALIDATE_FLOAT, FILTER_NULL_ON_FAILURE );
					settype( $val, 'float' );
					break;

				case 'int':
				case 'integer':
					$val = filter_var( $val, FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE );
					settype( $val, 'integer' );
					break;

				default:
			}

			$ret[$key] = $val;
		}

		return $ret;
	}

	/**
	 * @param Parser $parser
	 * @param mixed ...$argv
	 * @return array
	 */
	public static function parserFunctionPrint( Parser $parser, ...$argv ) {
		$title = $parser->getTitle();
/*
{{#visualdataprint: {{FULLPAGENAME}}
|?File
|?Caption
|template=DisplayPictures
|template?File=DisplayPicture
|values-separator=,<nowiki> </nowiki>
|separator=<br>
}}
*/
		$text = array_shift( $argv );

		$title_ = Title::newFromText( $text );
		if ( !$title_ || !$title_->isKnown() ) {

			// check if is an article id
			$title_ = Title::newfromid( $text );
			if ( !$title_ || !$title_->isKnown() ) {
				$title_ = $title;
			}
		}

		$argv[] = 'function=print';

		$query = '[[' . $title_->getFullText() . ']]';
		// array_unshift( $argv, $query );

		return self::parserFunctionQuery( $parser, ...[ $query, ...$argv ] );
		// return forward_static_call_array(
		// 	[\VisualData::class, 'parserFunctionQuery'],
		// 	[ $parser, ...$argv ]
		// );
	}

	/**
	 * @param Parser $parser
	 * @param mixed ...$argv
	 * @return array
	 */
	public static function parserFunctionQuery( Parser $parser, ...$argv ) {
		$parserOutput = $parser->getOutput();
		$title = $parser->getTitle();
		$parserOutput->setExtensionData( 'visualdataquery', true );
		$parser->addTrackingCategory( 'visualdata-trackingcategory-parserfunction-query' );

		$parserOutput->addModules( [ 'ext.VisualData.PrintResults' ] );
/*
{{#visualdataquery: [[approved::true]][[display_date::{{#time: Y-m-d }}]]
|?display_date
|?blurb
|?display_order
|schema=Curated page
|limit=
|sort=
|template=Curated page
|template?subitem=Curated page Sub
}}
*/
		$query = array_shift( $argv );

		$defaultParameters = self::$QueryDefaultParameters;

		array_walk( $defaultParameters, static function ( &$value, $key ) {
			$value = [ $value['default'], $value['type'] ];
		} );

		$defaultParameters['function'] = [ 'query', 'string' ];

		[ $values, $params, $unknownNamed ] = self::parseParameters( $argv, array_keys( $defaultParameters ) );

		$params = self::applyDefaultParams( $defaultParameters, $params );

		$printouts = [];

		// root template
		$templates = [ '' => $params['template'] ];

		// default printer format
		if ( empty( $params['format'] ) ) {
			if ( !empty( $params['template'] ) ) {
				$params['format'] = 'template';
			} elseif ( $params['function'] === 'print' || $params['limit'] === 1 ) {
				$params['format'] = 'json';
			} else {
				$params['format'] = 'table';
			}
		}

		foreach ( $values as $val ) {
			if ( strpos( $val, '?' ) === 0 ) {
				// the rationale for this is the following:
				// |?name is equal to |?name=name, where name is replaced
				// with the corresponding schema title if is set
				// |?name= is processed in templates but not rendered
				// |?name=abc abc is the field name
				$printouts[substr( $val, 1 )] = substr( $val, 1 );
			}
		}

		foreach ( $unknownNamed as $key => $val ) {
			if ( strpos( $key, 'template?' ) === 0 ) {
				if ( preg_match( '/^template(\?(.+))?=(.+)/', "$key=$val", $match ) ) {
					$templates[$match[2]] = $match[3];
				}
				unset( $unknownNamed[$key] );
				continue;
			}

			if ( strpos( $key, '?' ) === 0 ) {
				$printouts[substr( $key, 1 )] = $val;
				unset( $unknownNamed[$key] );
			}
		}

		// resort printouts based on parser function
		uksort( $printouts, static function ( $a, $b ) use ( $argv ) {
			foreach ( $argv as $value ) {
				if ( $value === "?$a" || strpos( $value, "?$a=" ) === 0 ) {
					return -1;
				}
				if ( $value === "?$b" || strpos( $value, "?$b=" ) === 0 ) {
					return 1;
				}
			}
			return 0;
		} );

		$returnError = static function ( $error ) {
			return [ $error,
				'isHTML' => false
			];
		};

		if ( empty( $params['schema'] ) ) {
			return $returnError( 'schema not set' );
		}

		if ( !array_key_exists( $params['format'], $GLOBALS['wgVisualDataResultPrinterClasses'] ) ) {
			return 'format not supported';
		}

		// parse format-related parameters
		$className = $GLOBALS['wgVisualDataResultPrinterClasses'][$params['format']];
		$class = "MediaWiki\Extension\VisualData\ResultPrinters\\{$className}";
		if ( property_exists( $class, 'parameters' ) ) {
			$defaultParameters_ = $class::$parameters;
			array_walk( $defaultParameters_, static function ( &$value, $key ) {
				$value = [ $value['default'], $value['type'] ];
			} );
			$params_ = self::applyDefaultParams( $defaultParameters_, $unknownNamed );
			$params = array_merge( $params, $params_ );
		}

		$databaseManager = new DatabaseManager();

		// this is still the title of the parent page (in case of
		// transclusion)
		// $databaseManager->storeLink( $title, 'query', $params['schema'] );

		// used for template links
		$params_ = $params;
		$params_['templates'] = $templates;

		self::$queries[] = $params_;
		$parserOutput->setExtensionData( 'visualdataqueries', self::$queries );

		if ( !$databaseManager->schemaExists( $params['schema'] ) ) {
			return $returnError( 'schema does not exist' );
		}

		$context = RequestContext::getMain();

		$resultPrinter = self::getResults(
			$parser,
			$context,
			$query,
			$templates,
			$printouts,
			$params
		);

		$results = ( $resultPrinter ? $resultPrinter->getResults() : '' );
		$isHtml = ( $resultPrinter ? $resultPrinter->isHtml() : false );

		return [ $results, 'isHTML' => $isHtml ];
	}

	/**
	 * @param User $user
	 * @param ParserOutput $parserOutput
	 * @param Title $title
	 * @param DatabaseManager $databaseManager
	 */
	public static function handleLinks( $user, $parserOutput, $title, $databaseManager ) {
		$databaseManager->removeLinks( $title );

		$getTransclusionParserOutput = static function () use ( $user, $title ) {
			$transclusionTargets = self::getTransclusionTargets( $title );
			if ( !count( $transclusionTargets ) ) {
				return null;
			}
			$title_ = $transclusionTargets[0];
			$wikiPage = self::getWikiPage( $title_ );
			if ( !$wikiPage ) {
				return null;
			}
			$parserOptions = ParserOptions::newFromUser( $user );
			return $wikiPage->getParserOutput( $parserOptions );
		};

		$formsData = null;
		$queriesData = null;
		if ( $parserOutput->getExtensionData( 'visualdataform' ) !== null ) {
			$formsData = $parserOutput->getExtensionData( 'visualdataforms' );

		// *** workaround to also match parserfunctions
		// within includeonly tags
		} else {
			$parserOutput_ = $getTransclusionParserOutput();
			if ( $parserOutput_ && $parserOutput_->getExtensionData( 'visualdataform' ) !== null ) {
				$formsData = $parserOutput_->getExtensionData( 'visualdataforms' );
			}
		}

		if ( $formsData ) {
			foreach ( $formsData as $formID => $value ) {
				$databaseManager->storeLink( $title, 'form', $value['schemas'] );
			}
		}

		if ( $parserOutput->getExtensionData( 'visualdataquery' ) !== null ) {
			$queriesData = $parserOutput->getExtensionData( 'visualdataqueries' );

		} else {
			$parserOutput_ = $parserOutput_ ?? $getTransclusionParserOutput();
			if ( $parserOutput_ && $parserOutput_->getExtensionData( 'visualdataquery' ) !== null ) {
				$queriesData = $parserOutput_->getExtensionData( 'visualdataqueries' );
			}
		}

		if ( $queriesData ) {
			foreach ( $queriesData as $value ) {
				$databaseManager->storeLink( $title, 'query', $value['schema'] );
				$databaseManager->storeLinkTemplates( $title, $value['schema'], $value['templates'] ?? [] );
			}
		}

		$databaseManager->invalidateTransclusionTargets( $title );
	}

	/**
	 * @param Parser $parser
	 * @param Context $context
	 * @param string $query
	 * @param array $templates
	 * @param array $printouts
	 * @param array $params
	 * @return bool|ResultPrinter
	 */
	public static function getResults(
		$parser,
		$context,
		$query,
		$templates,
		$printouts,
		$params
	) {
		if ( empty( $params['schema'] ) || empty( $params['format'] ) ) {
			return false;
		}
		$schema = self::getSchema( $context, $params['schema'] );
		if ( !$schema ) {
			return false;
		}
		if ( !array_key_exists( $params['format'], $GLOBALS['wgVisualDataResultPrinterClasses'] ) ) {
			return false;
		}
		$className = $GLOBALS['wgVisualDataResultPrinterClasses'][$params['format']];
		$class = "MediaWiki\Extension\VisualData\ResultPrinters\\{$className}";
		$queryProcessor = new QueryProcessor( $schema, $query, $printouts, $params );

		return new $class( $parser, $context->getOutput(), $queryProcessor, $schema, $templates, $params, $printouts );
	}

	/**
	 * @param string $schema
	 * @param string $query
	 * @param array $printouts []
	 * @param string $format json-raw
	 * @return null|array
	 */
	public static function getQueryResults( $schema, $query, $printouts = [], $format = 'json-raw' ) {
		$context = RequestContext::getMain();

		$params = [
			'schema' => $schema,
			'format' => $format
		];

		$parser = MediaWikiServices::getInstance()->getParserFactory()->create();
		$templates = [];

		$resultPrinter = self::getResults(
			$parser,
			$context,
			$query,
			$templates,
			$printouts,
			$params
		);

		if ( !$resultPrinter ) {
			return null;
		}

		return $resultPrinter->getResults();
	}

	/**
	 * @param array $parameters
	 * @param array $defaultParameters []
	 * @return array
	 */
	public static function parseParameters( $parameters, $defaultParameters = [] ) {
		// unnamed parameters
		$a = [];

		// known named parameters
		$b = [];

		// unknown named parameters
		$c = [];
		foreach ( $parameters as $value ) {
			if ( strpos( $value, '=' ) !== false ) {
				[ $k, $v ] = explode( '=', $value, 2 );
				$k = trim( $k );
				$k_ = str_replace( ' ', '-', $k );

				if ( in_array( $k, $defaultParameters ) || in_array( $k_, $defaultParameters ) ) {
					$b[$k_] = trim( $v );
					continue;
				} else {
					$c[$k] = trim( $v );
					continue;
				}
			}
			$a[] = $value;
		}

		return [ $a, $b, $c ];
	}

	/**
	 * @param Title $title
	 * @return null|array
	 */
	public static function getSlots( $title ) {
		$key = $title->getFullText();

		if ( array_key_exists( $key, self::$slotsCache ) ) {
			return self::$slotsCache[$key];
		}

		$revision = self::revisionRecordFromTitle( $title );

		if ( !$revision ) {
			return;
		}

		self::$slotsCache[$key] = $revision->getSlots()->getSlots();

		return self::$slotsCache[$key];
	}

	/**
	 * @param Title $title
	 * @return void
	 */
	public static function emptySlotsCache( $title ) {
		$key = $title->getFullText();
		unset( self::$slotsCache[$key] );
	}

	/**
	 * @param Title $title
	 * @param array $slots
	 * @return void
	 */
	public static function setSlots( $title, $slots ) {
		$key = $title->getFullText();
		self::$slotsCache[$key] = $slots;
	}

	/**
	 * @param Title $title
	 * @return false|array
	 */
	public static function getJsonData( $title ) {
		// @ATTENTION!
		// $page_id is 0 for newly created pages
		// $title->getArticleID();
		$key = $title->getFullText();

		// read from cache
		if ( array_key_exists( $key, self::$cachedJsonData ) ) {
			return self::$cachedJsonData[ $key ];
		}

		if ( !$title->canExist() ) {
			return false;
		}
		self::$cachedJsonData[ $key ] = false;

		if ( !$title->isKnown() ) {
			return false;
		}

		$wikiPage = self::getWikiPage( $title );

		if ( !$wikiPage ) {
			return false;
		}

		$slots = self::getSlots( $title );

		if ( !$slots ) {
			return false;
		}

		$content = null;
		foreach ( $slots as $role => $slot ) {
			$content_ = $slots[$role]->getContent();
			$modelId = $content_->getContentHandler()->getModelID();

			if ( $role === SLOT_ROLE_VISUALDATA_JSONDATA
				|| $modelId === CONTENT_MODEL_VISUALDATA_JSONDATA
				|| $modelId === 'json' ) {
				$content = $content_;
				break;
			}
		}

		if ( empty( $content ) ) {
			return false;
		}

		$contents = $content->getNativeData();

		$ret = json_decode( $contents, true );

		if ( empty( $ret ) ) {
			return false;
		}

		self::$cachedJsonData[ $key ] = $ret;
		return $ret;
	}

	/**
	 * @param Context $context
	 * @param string $name
	 * @return array|null
	 */
	public static function getSchema( $context, $name ) {
		self::getSchemas( $context, [ $name ] );
		if ( array_key_exists( $name, self::$schemas ) && !empty( self::$schemas[$name] ) ) {
			return self::$schemas[$name];
		}
	}

	/**
	 * @param Context $context
	 * @param array $schemas
	 * @param bool $loadData
	 * @return array
	 */
	public static function getSchemas( $context, $schemas, $loadData = true ) {
		$schemaProcessor = new SchemaProcessor( $context );
		self::setSchemas( $schemaProcessor, $schemas, $loadData );
		return self::$schemas;
	}

	/**
	 * @see includes/api/ApiBase.php
	 * @param User $user
	 * @param Title $title
	 * @param array &$errors
	 * @return bool
	 */
	public static function checkWritePermissions( $user, $title, &$errors ) {
		$actions = [ 'edit' ];
		if ( !$title->isKnown() ) {
			$actions[] = 'create';
		}

		if ( class_exists( 'MediaWiki\Permissions\PermissionStatus' ) ) {
			$status = new MediaWiki\Permissions\PermissionStatus();
			foreach ( $actions as $action ) {
				$user->authorizeWrite( $action, $title, $status );
			}
			if ( !$status->isGood() ) {
				return false;
			}
			return true;
		}

		$PermissionManager = MediaWikiServices::getInstance()->getPermissionManager();
		$errors = [];
		foreach ( $actions as $action ) {
			$errors = array_merge(
				$errors,
				$PermissionManager->getPermissionErrors( $action, $user, $title )
			);
		}

		return ( count( $errors ) === 0 );
	}

	/**
	 * @param User $user
	 * @param Title $title
	 * @param array $schemas
	 * @param string $defaultSlot
	 * @param array &$errors
	 * @return bool
	 */
	public static function updateCreateSchemas(
		$user,
		$title,
		$schemas,
		$defaultSlot = 'jsondata',
		&$errors = []
	) {
		$jsonData = self::getJsonData( $title );

		if ( !$jsonData ) {
			$jsonData = [];
		}

		if ( !isset( $jsonData['schemas'] ) ) {
			$jsonData['schemas'] = [];
		}

		$jsonData['schemas'] = self::array_merge_recursive( $jsonData['schemas'], $schemas );

		$targetSlot = self::getTargetSlot( $title, $defaultSlot );

		$slots = [
			$targetSlot => [
				'model' => CONTENT_MODEL_VISUALDATA_JSONDATA,
				'content' => $jsonData
			]
		];

		self::rebuildArticleData( $user, $title, $jsonData, $errors );

		$ret = self::setJsonData(
			$user,
			$title,
			$slots,
			$errors,
		);
	}

	/**
	 * @param User $user
	 * @param Title $title
	 * @param array $slotsData
	 * @param array &$errors
	 * @return bool
	 */
	public static function setJsonData(
		$user,
		$title,
		$slotsData,
		&$errors = []
	) {
		$canWrite = self::checkWritePermissions( $user, $title, $errors );

		if ( !$canWrite ) {
			return false;
		}

		$obj = [];
		foreach ( $slotsData as $slotName => $value ) {
			if ( $value['model'] === CONTENT_MODEL_VISUALDATA_JSONDATA
				&& is_array( $value['content'] ) ) {
				$keys = [ 'schemas', 'schemas-data', 'categories' ];
				foreach ( $keys as $key ) {
					if ( empty( $value['content'][$key] ) ) {
						unset( $value['content'][$key] );
					}
				}

				if ( empty( $value['content']['schemas'] ) ) {
					unset( $value['content']['schemas-data'] );
				}

				if ( isset( $value['content']['schemas-data'] ) && is_array( $value['content']['schemas-data'] ) ) {
					if ( is_array( $value['content']['schemas-data']['untransformed'] ) ) {
						foreach ( $value['content']['schemas-data']['untransformed'] as $k => $v ) {
							// @FIXME save untrasformed values for each schema
							$schemaName = self::unescapeJsonKey( substr( $k, 0, strpos( $k, '/' ) ) );
							if ( is_array( $value['content']['schemas'] )
								&& !array_key_exists( $schemaName, $value['content']['schemas'] ) ) {
								unset( $value['content']['schemas-data']['untransformed'][$k] );
							}
						}
					}
					if ( array_key_exists( 'untransformed', $value['content']['schemas-data'] )
						&& empty( $value['content']['schemas-data']['untransformed'] ) ) {
						unset( $value['content']['schemas-data']['untransformed'] );
					}
				}

				if ( empty( $value['content'] ) ) {
					$slotsData[$slotName]['content'] = null;
				} else {
					$obj = $value['content'];
					$slotsData[$slotName]['content'] = json_encode( $value['content'] );
				}
			}
		}

		// *** this needs to be set before $pageUpdater->saveRevision
		// to ensure onContentAlterParserOutput has updated data
		$key = $title->getFullText();
		self::$cachedJsonData[ $key ] = $obj;

		return self::recordSlots( $user, $title, $slotsData );
	}

	/**
	 * // phpcs:ignore MediaWiki.Commenting.FunctionAnnotations.UnrecognizedAnnotation
	 * @credits WSSlots MediaWiki extension - Wikibase Solutions
	 * @param User $user
	 * @param Title $title
	 * @param array $slotsData
	 * @param bool $doNullEdit false
	 * @return bool
	 */
	private static function recordSlots( $user, $title, $slotsData, $doNullEdit = false ) {
		$wikiPage = self::getWikiPage( $title );
		if ( !$wikiPage ) {
			self::$Logger->error( 'recordSlots: no wikiPage for ' . $title->getFullText() );
			return false;
		}
		$services = MediaWikiServices::getInstance();
		$oldRevisionRecord = $wikiPage->getRevisionRecord();
		$slotRoleRegistry = $services->getSlotRoleRegistry();
		$contentHandlerFactory = $services->getContentHandlerFactory();
		$contentModels = $contentHandlerFactory->getContentModels();
		// $knownRoles = $slotRoleRegistry->getKnownRoles();

		$pageUpdater = $wikiPage->newPageUpdater( $user );

		// delete article if the current slots are empty
		// and there aren't more slots on the page
		if ( $oldRevisionRecord ) {
			$existingSlots = $oldRevisionRecord->getSlots()->getSlots();
			$emptySlots = true;
			foreach ( $slotsData as $slotName => $value ) {
				if ( !empty( $value['content'] ) ) {
					$emptySlots = false;
					break;
				}
			}

			if ( $emptySlots && !count( array_diff( array_keys( $existingSlots ),
				array_keys( $slotsData ) ) ) ) {
				$reason = '';
				self::deletePage( $wikiPage, $user, $reason );
				return;
			}

			// remove SLOT_ROLE_VISUALDATA_JSONDATA if
			// jsondata have been moved to main
			if ( isset( $slotsData[SlotRecord::MAIN] )
				&& $slotsData[SlotRecord::MAIN]['model'] === CONTENT_MODEL_VISUALDATA_JSONDATA ) {
				foreach ( $existingSlots as $slotName => $value ) {
					if ( $slotName === SLOT_ROLE_VISUALDATA_JSONDATA ) {
						$pageUpdater->removeSlot( $slotName );
					}
				}
			}
		}

		// The 'main' content slot MUST be set when creating a new page
		if ( $oldRevisionRecord === null && !array_key_exists( MediaWiki\Revision\SlotRecord::MAIN, $slotsData ) ) {
			$newMainSlot = true;
			$main_content = ContentHandler::makeContent( '', $title );
			$pageUpdater->setContent( SlotRecord::MAIN, $main_content );
		}

		foreach ( $slotsData as $slotName => $value ) {
			$text = $value['content'];

			if ( !isset( $value['model'] ) || !in_array( $value['model'], $contentModels ) ) {
				if ( $oldRevisionRecord !== null && $oldRevisionRecord->hasSlot( $slotName ) ) {
					$modelId = $oldRevisionRecord->getSlot( $slotName )->getContent()->getContentHandler()->getModelID();

				} else {
					$modelId = $slotRoleRegistry->getRoleHandler( $slotName )->getDefaultModel( $title );
				}
			} else {
				$modelId = $value['model'];
			}

			// remove slot if content is empty
			// and isn't main slot
			if ( empty( $text ) && $slotName !== SlotRecord::MAIN ) {
				$pageUpdater->removeSlot( $slotName );
				continue;
			}

			// back-compatibility
			if ( $slotName === SLOT_ROLE_VISUALDATA_JSONDATA && $modelId === 'json' ) {
				$pageUpdater->removeSlot( $slotName );
				continue;
			}
			$slotContent = ContentHandler::makeContent( $text, $title, $modelId );
			$pageUpdater->setContent( $slotName, $slotContent );
		}

		// *** this ensures that onContentAlterParserOutput relies
		// on updated data
		if ( method_exists( MediaWiki\Storage\PageUpdater::class, 'prepareUpdate' ) ) {
			$derivedDataUpdater = $pageUpdater->prepareUpdate();
			$slots = $derivedDataUpdater->getSlots()->getSlots();
			self::setSlots( $title, $slots );
		}
		$summary = 'VisualData update';
		$flags = EDIT_INTERNAL;
		$comment = CommentStoreComment::newUnsavedComment( $summary );
		$RevisionRecord = $pageUpdater->saveRevision( $comment, $flags );

		// Perform an additional null-edit if requested
		if ( $doNullEdit && !$pageUpdater->isUnchanged() ) {
			$comment = CommentStoreComment::newUnsavedComment( '' );
			$pageUpdater = $wikiPage->newPageUpdater( $user );
			$pageUpdater->saveRevision( $comment, EDIT_SUPPRESS_RC | EDIT_AUTOSUMMARY );
		}

		// or !$pageUpdater->isUnchanged()
		return $RevisionRecord !== null;
	}

	/**
	 * @param Title $title
	 * @param string $targetSlot
	 * @return string
	 */
	public static function getTargetSlot( $title, $targetSlot = 'jsondata' ) {
		if ( !$title || !$title->isKnown() ) {
			return $targetSlot;
		}
		$slots = array_reverse( self::getSlots( $title ) );

		if ( !$slots ) {
			return $targetSlot;
		}

		foreach ( $slots as $role => $slot ) {
			$content = $slots[$role]->getContent();
			$modelId = $content->getContentHandler()->getModelID();
			if ( $role === SLOT_ROLE_VISUALDATA_JSONDATA
				|| $modelId === CONTENT_MODEL_VISUALDATA_JSONDATA ) {
					return $role;
			}
		}
		return $targetSlot;
	}

	/**
	 * @param User $user
	 * @param Title $title
	 * @param Content $content
	 * @param array &$errors
	 */
	public static function rebuildArticleDataFromSlot( $user, $title, $content, &$errors ) {
		if ( empty( $content ) ) {
			return;
		}

		$contents = $content->getNativeData();
		$data = json_decode( $contents, true );

		self::rebuildArticleData( $user, $title, $data, $errors );
	}

	/**
	 * @param User $user
	 * @param Title $title
	 * @param array $data
	 * @param array &$errors
	 */
	public static function rebuildArticleData( $user, $title, $data, &$errors ) {
		if ( empty( $data['schemas'] ) ) {
			return;
		}

		$schemas = array_keys( $data['schemas'] );
		$context = RequestContext::getMain();

		// @FIXME this will also process schemas, but it
		// is not required since we need only type and format
		$schemas = self::getSchemas( $context, $schemas, true );

		$databaseManager = new DatabaseManager();
		$schemaProcessor = new SchemaProcessor( $context );
		$flatten = [];

		foreach ( $data['schemas'] as $schemaName => $value ) {
			if ( !array_key_exists( $schemaName, $schemas ) ) {
				$schema = $schemaProcessor->generateFromData( $value, $schemaName );

				$title_ = Title::makeTitleSafe( NS_VISUALDATASCHEMA, $schemaName );
				$statusOK = self::saveRevision( $user, $title_, json_encode( $schema ) );
				if ( !$statusOK ) {
					self::$Logger->error( 'rebuildArticleData cannot save schema' );
					continue;
				}
				$schemas[$schemaName] = $schemaProcessor->processSchema( $schema, $schemaName );
			}

			$flatten = array_merge( $flatten, $databaseManager->prepareData( $schemas[$schemaName], $value ) );
		}

		$databaseManager->recordProperties( 'rebuildArticleData', $title, $flatten, $errors );
		$databaseManager->removeUnusedEntries();
	}

	/**
	 * @param User $user
	 * @param WikiPage $wikiPage
	 * @param RevisionRecord $revisionRecord
	 * @param int|null $revertMethod
	 */
	public static function onArticleSaveOrUndelete( $user, $wikiPage, $revisionRecord, $revertMethod ) {
		$databaseManager = new DatabaseManager();
		$title = $wikiPage->getTitle();

		// purge pages with queries using this template
		// (and their transclusion targets)
		if ( $title->getNamespace() === NS_TEMPLATE ) {
			$databaseManager->handleTemplateLinks( $title );
			return;
		}

		$slots = $revisionRecord->getSlots()->getSlots();
		// main slot and modelId of main slot
		$slot = null;
		$modelId = null;

		if ( array_key_exists( SlotRecord::MAIN, $slots ) ) {
			$slot = $slots[SlotRecord::MAIN];
			$content = $slot->getContent();
			$modelId = $content->getContentHandler()->getModelID();

			if ( $modelId === 'wikitext' ) {
				$contents = $content->getNativeData();
				// @see maintenance/rebuildData
				if ( preg_match( '/#v(isual)?data(form|print|query)/', $contents ) ) {
					// or ParserOptions::newFromAnon()
					$parserOptions = ParserOptions::newFromUser( $user );
					$parserOutput = $wikiPage->getParserOutput( $parserOptions );
					// *** or
					// $services = MediaWikiServices::getInstance();
					// $context = RequestContext::getMain();
					// $options = $wikiPage->makeParserOptions( $context );
					// $renderedRevision = $services->getRevisionRenderer()->getRenderedRevision( $revisionRecord, $options );
					// $parserOutput = $renderedRevision->getSlotParserOutput( SlotRecord::MAIN );
					self::handleLinks( $user, $parserOutput, $title, $databaseManager );
				}
			}
		}

		// rebuild article data on undelete
		if ( array_key_exists( SLOT_ROLE_VISUALDATA_JSONDATA, $slots ) ) {

			// rebuild only if restoring a revision
			if ( $revertMethod === null ) {
				return;
			}

			$slot = $slots[SLOT_ROLE_VISUALDATA_JSONDATA];

		// rebuild only if main slot contains json data
		} elseif ( $modelId !== 'json' && $modelId !== CONTENT_MODEL_VISUALDATA_JSONDATA ) {
			return;
		}

		if ( $slot ) {
			$content = $slot->getContent();
			$errors = [];
			self::rebuildArticleDataFromSlot( $user, $title, $content, $errors );
			// $databaseManager->invalidateTransclusionTargets( $title );
		}
	}

	/**
	 * @param Title $title
	 * @return WikiPage|null
	 */
	public static function getWikiPage( $title ) {
		if ( !$title || !$title->canExist() ) {
			return null;
		}
		// MW 1.36+
		if ( method_exists( MediaWikiServices::class, 'getWikiPageFactory' ) ) {
			return MediaWikiServices::getInstance()->getWikiPageFactory()->newFromTitle( $title );
		}
		return WikiPage::factory( $title );
	}

	/**
	 * @param string $titletText
	 * @return Title|null
	 */
	public static function getTitleIfKnown( $titletText ) {
		$title = Title::newFromText( $titletText );
		if ( $title && $title->isKnown() ) {
			return $title;
		}
		return null;
	}

	/**
	 * @param Title $title
	 * @param array $pageForms
	 * @param array $config
	 * @return array
	 */
	private static function processPageForms( $title, $pageForms, $config ) {
		$services = MediaWikiServices::getInstance();
		$slotRoleRegistry = $services->getSlotRoleRegistry();

		if ( $config['context'] !== 'EditData' ) {
			$databaseManager = new DatabaseManager();
		}

		foreach ( $pageForms as $formID => $value ) {
			// if ( $config['context'] !== 'EditData' ) {
			//	$databaseManager->storeLink( $title, 'form', $value['schemas'] );
			// }

			$jsonData = [];
			$freetext = null;
			$categories = [];
			$editTitle = null;
			$targetSlot = $value['options']['target-slot'];

			// if ( !empty( $value['options']['preload'] ) ) {
			// 	$title_ = self::getTitleIfKnown( $value['options']['preload'] );
			// 	if ( $title_ ) {
			// 		$freetext = self::getWikipageContent( $title_ );
			// 	}
			// }

			if ( $value['options']['action'] === 'edit' ) {
				if ( $title ) {
					$editTitle = $title;
				}

				if ( !empty( $value['options']['edit-page'] ) ) {
					// $editTitle = self::getTitleIfKnown( $value['options']['edit-page'] );
					// can be unknown
					$editTitle = Title::newFromText( $value['options']['edit-page'] );
				}

				if ( $editTitle ) {
					$pageForms[$formID]['options']['edit-page'] = $editTitle->getFullText();
					$jsonData = self::getJsonData( $editTitle );

					if ( empty( $targetSlot ) ) {
						$targetSlot = self::getTargetSlot( $editTitle, 'jsondata' );
					}
				}
			}

			// for the jsonData are considered empty
			// the json data related to the schemas contained
			// in the form have to be empty
			$emptyData = empty( $jsonData['schemas'] )
				|| !count( array_intersect_key( $jsonData['schemas'],
					array_fill_keys( $value['schemas'], null ) ) );

			if ( $emptyData && !empty( $value['options']['preload-data'] ) ) {
				$jsonData = self::getPreloadData( $value['options']['preload-data'] );

				if ( !empty( $jsonData ) ) {
					$title_ = self::getTitleIfKnown( $value['options']['preload-data'] );
					$modelId = $slotRoleRegistry->getRoleHandler( SlotRecord::MAIN )->getDefaultModel( $title_ );

					// if jsonData is a simple json, apply the provided
					// data to the current schema if not defined in the
					// data themselves
					if ( $modelId === 'json' && !array_exists( 'schemas', $jsonData ) ) {
						$jsonData['schemas'] = $jsonData;
						if ( count( $value['schemas'] ) === 1 && !array_exists( $value['schemas'][0], $jsonData['schemas'] ) ) {
							$jsonData['schemas'][$value['schemas'][0]] = $jsonData['schemas'];
						}
					}
				}
			}

			if ( $emptyData && !empty( $value['options']['preload-data-override'] )
				&& class_exists( 'Swaggest\JsonDiff\JsonPointer' ) ) {

				foreach ( $value['options']['preload-data-override'] as $k => $v ) {
					// @TODO also try unescaped array keys as in
					// QueryProcessor -> performQuery
					$pathItems = explode( '/', $k );
					if ( count( $value['schemas'] ) === 1 ) {
						if ( !in_array( $pathItems[0], $value['schemas'] ) ) {
							array_unshift( $pathItems, $value['schemas'][0] );
						}
					} elseif ( !in_array( $pathItems[0], $value['schemas'] ) ) {
						// @FIXME $Logger is undefined when called from the api
						// self::$Logger->error( 'schema must be specified' );
						continue;
					}
					array_unshift( $pathItems, 'schemas' );
					JsonPointer::add( $jsonData, $pathItems, $v,
						JsonPointer::TOLERATE_ASSOCIATIVE_ARRAYS | JsonPointer::RECURSIVE_KEY_CREATION );
				}
			}

			if ( $value['options']['edit-categories'] === true && $editTitle ) {
				$categories = self::getCategories( $editTitle );
			}

			if ( $value['options']['edit-freetext'] === true && $editTitle ) {
				$freetext = self::getWikipageContent( $editTitle );

				// if ( ExtensionRegistry::getInstance()->isLoaded( 'VEForAll' ) ) {
				//	$out->addModules( 'ext.veforall.main' );
				// }
			}

			$formData = &$pageForms[$formID];
			$formData['emptyData'] = $emptyData;
			$formData['jsonData'] = ( !empty( $jsonData ) ? $jsonData : [] );
			$formData['categories'] = $categories;
			$formData['freetext'] = $freetext;
			$formData['errors'] = [];

			// show errors (SubmitForm)
			if ( !array_key_exists( 'origin-url', $value['options'] ) ) {
				$pageForms[$formID]['options']['origin-url'] = $title->getLocalURL();
			}

			// otherwise return-url is the target title
			// @see SubmitForm
			if ( empty( $value['options']['return-url'] )
				&& !empty( $value['options']['return-page'] ) ) {
				$title_ = self::getTitleIfKnown( $value['options']['return-page'] );
				$query = '';

				if ( !$title_ ) {
					$pos_ = strpos( $value['options']['return-page'], '?' );
					if ( $pos_ !== false ) {
						$title_ = self::getTitleIfKnown( substr( $value['options']['return-page'], 0, $pos_ ) );
						$query = substr( $value['options']['return-page'], $pos_ + 1 );
					}
				}

				if ( $title_ ) {
					$pageForms[$formID]['options']['return-url'] = $title_->getLocalURL( $query );
				}
			}

			$pageForms[$formID]['options']['target-slot'] = $targetSlot ?? 'jsondata';
		}

		return $pageForms;
	}

	/**
	 * @param string $titleText
	 * @param Title|null &$title
	 * @return array
	 */
	public static function getPreloadData( $titleText, &$title = null ) {
		$title = self::getTitleIfKnown( $titleText );
		if ( !$title ) {
			return [];
		}
		$jsonData = self::getJsonData( $title );
		if ( $jsonData !== false ) {
			return $jsonData;
		}
		return [];
	}

	/**
	 * @param OutputPage $out
	 * @param array $obj
	 * @return void
	 */
	public static function addJsConfigVars( $out, $obj ) {
		$title = $out->getTitle();
		$user = $out->getUser();
		$context = $out->getContext();
		$schemaProcessor = new SchemaProcessor( $context );
		$loadedData = [];

		if ( isset( $obj['pageForms'] ) ) {
			// this will populate self::$schemas with data
			foreach ( $obj['pageForms'] as $value ) {
				self::setSchemas( $schemaProcessor, $value['schemas'] );
			}

			// *** this accounts also of forms inside forms
			// *** attention! switch to array_merge in case of
			// non-numerical keys
			$obj['pageForms'] = $obj['pageForms'] + self::$pageForms;
			$obj['pageForms'] = self::processPageForms( $title, $obj['pageForms'], $obj['config'] );
		}
		if ( isset( $_SESSION ) && !empty( $_SESSION['visualdataform-submissiondata'] ) ) {
			foreach ( $_SESSION['visualdataform-submissiondata'] as $formData ) {
				self::setSchemas( $schemaProcessor, $formData['schemas'] );
			}
		}

		// load all schemas also if context is !== than 'EditData'
		// to display them in ask query schemas and other inputs
		if ( ( $user->isAllowed( 'visualdata-caneditdata' )
				|| $user->isAllowed( 'visualdata-canmanageschemas' )
			) ) {
			$loadedData[] = 'schemas';
			// this will retrieve all schema pages without contents
			// without content @TODO set a limit
			$schemasArr = self::getAllSchemas();
			self::setSchemas( $schemaProcessor, $schemasArr, false );
		}

		$obj['schemas'] = self::$schemas;

		$schemaUrl = self::getFullUrlOfNamespace( NS_VISUALDATASCHEMA );

		// this is required as long as a 'OO.ui.SelectFileWidget'
		// is added to a schema
		$allowedMimeTypes = $schemaProcessor->getAllowedMimeTypes();

		$VEForAll = false;
		if ( ExtensionRegistry::getInstance()->isLoaded( 'VEForAll' )
			&& self::VEenabledForUser( $user ) ) {
			$userOptionsManager = MediaWikiServices::getInstance()->getUserOptionsManager();
			$userOptionsManager->setOption( $user, 'visualeditor-enable', true );
			$VEForAll = true;
			$out->addModules( 'ext.veforall.main' );
		}

		$default = [
			'schemas' => [],
			'pageForms' => [],
			'categories' => [],
			'config' => [
				'VisualDataSchemaUrl' => $schemaUrl,
				'actionUrl' => SpecialPage::getTitleFor( 'VisualDataSubmit', $title->getPrefixedDBkey() )->getLocalURL(),
				'isNewPage' => $title->getArticleID() === 0 || !$title->isKnown(),
				'loadedData' => $loadedData,
				'allowedMimeTypes' => $allowedMimeTypes,
				'caneditdata' => $user->isAllowed( 'visualdata-caneditdata' ),
				'canmanageschemas' => $user->isAllowed( 'visualdata-canmanageschemas' ),
				// 'canmanageforms' => $user->isAllowed( 'visualdata-canmanageforms' ),
				'contentModels' => array_flip( self::getContentModels() ),
				'contentModel' => $title->getContentModel(),
				// self::$SMW,
				'SMW' => false,
				'VEForAll' => $VEForAll,
				'jsonDiffLibrary' => class_exists( 'Swaggest\JsonDiff\JsonDiff' )
			],
		];

		$config = $obj['config'];
		$obj = array_merge( $default, $obj );
		$obj['config'] = self::array_merge_recursive( $default['config'], $config );

		$groups = [ 'sysop', 'bureaucrat', 'visualdata-admin' ];
		$showOutdatedVersion = empty( $GLOBALS['wgVisualDataDisableVersionCheck'] )
			&& (
				$user->isAllowed( 'canmanageschemas' )
				|| count( array_intersect( $groups, self::getUserGroups( $user ) ) )
			);

		$out->addJsConfigVars( [
			// @see VEForAll ext.veforall.target.js -> getPageName
			'wgPageFormsTargetName' => ( $title && $title->canExist() ? $title
				: Title::newMainPage() )->getFullText(),

			'visualdata-schemas' => json_encode( $obj['schemas'], true ),
			'visualdata-pageforms' => json_encode( $obj['pageForms'], true ),
			'visualdata-config' => json_encode( $obj['config'], true ),
			'visualdata-show-notice-outdated-version' => $showOutdatedVersion,
			'visualdata-maptiler-apikey' => $GLOBALS['wgVisualDataMaptilerApiKey']
		] );
	}

	/**
	 * @see VisualEditor/includes/Hooks.php
	 * @param User $user
	 * @return bool
	 */
	private static function VEenabledForUser( $user ) {
		$services = MediaWikiServices::getInstance();
		$veConfig = $services->getConfigFactory()->makeConfig( 'visualeditor' );
		$userOptionsLookup = $services->getUserOptionsLookup();
		$isBeta = ( $veConfig->has( 'VisualEditorEnableBetaFeature' ) && $veConfig->get( 'VisualEditorEnableBetaFeature' ) );

		return ( $isBeta ?
			$userOptionsLookup->getOption( $user, 'visualeditor-enable' ) :
			!$userOptionsLookup->getOption( $user, 'visualeditor-betatempdisable' ) ) &&
			!$userOptionsLookup->getOption( $user, 'visualeditor-autodisable' );
	}

	/**
	 * @param int $ns
	 * @return string
	 */
	public static function getFullUrlOfNamespace( $ns ) {
		global $wgArticlePath;

		$formattedNamespaces = MediaWikiServices::getInstance()
			->getContentLanguage()->getFormattedNamespaces();
		$namespace = $formattedNamespaces[$ns];

		$schemaUrl = str_replace( '$1', "$namespace:", $wgArticlePath );
		return wfExpandUrl( $schemaUrl );
	}

	/**
	 * @param Title $title
	 * @return bool
	 */
	public static function isKnownArticle( $title ) {
		// *** unfortunately we cannot always rely on $title->isContentPage()
		// @see https://github.com/debtcompliance/EmailPage/pull/4#discussion_r1191646022
		// or use $title->exists()
		return ( $title && $title->canExist() && $title->getArticleID() > 0
			&& $title->isKnown() );
	}

	/**
	 * @param SchemaProcessor $schemaProcessor
	 * @param array $schemas
	 * @param bool $loadSchemas
	 * @return array
	 */
	public static function setSchemas( $schemaProcessor, $schemas, $loadSchemas = true ) {
		$ret = [];
		foreach ( $schemas as $value ) {
			$title = Title::newFromText( $value, NS_VISUALDATASCHEMA );

			if ( !$title || !$title->isKnown() ) {
				continue;
			}

			$titleText = $title->getText();

			if ( array_key_exists( $titleText, self::$schemas )
				&& !empty( self::$schemas[$titleText] ) ) {
				continue;
			}

			// load only schemas actually in the page
			if ( $loadSchemas === false ) {
				self::$schemas[$titleText] = [];
				continue;
			}

			$text = self::getWikipageContent( $title );
			if ( !empty( $text ) ) {
				$json = json_decode( $text, true );
				if ( $json ) {
					self::$schemas[$titleText] = $schemaProcessor->processSchema( $json, $titleText );
				}
			}
		}
	}

	/**
	 * @param string $key
	 * @return string
	 */
	public static function unescapeJsonKey( $key ) {
		$ret = str_replace( '~1', '/', $key );
		return str_replace( '~0', '~', $ret );
	}

	/**
	 * @see https://github.com/SemanticMediaWiki/SemanticResultFormats/blob/master/formats/datatables/DataTables.php#L695
	 * @param array $items
	 * @param bool $unescapeJsonKeys false
	 * @param string $token
	 * @return array
	 */
	public static function plainToNested( $items, $unescapeJsonKeys = false, $token = '/' ) {
		$ret = [];
		foreach ( $items as $key => $value ) {
			$ref = &$ret;
			$parts = explode( $token, $key );

			if ( $unescapeJsonKeys ) {
				foreach ( $parts as $k => $v ) {
					$parts[$k] = self::unescapeJsonKey( $v );
				}
			}

			$last = array_pop( $parts );
			foreach ( $parts as $part ) {
				$ref[$part][''] = null;
				$ref = &$ref[$part];
				unset( $ref[''] );
			}
			$ref[$last] = $value;
		}
		return $ret;
	}

	/**
	 * @return array
	 */
	public static function getAllSchemas() {
		$arr = self::getPagesWithPrefix( null, NS_VISUALDATASCHEMA );
		$ret = [];
		foreach ( $arr as $title_ ) {
			$ret[] = $title_->getText();
		}
		return $ret;
	}

	/**
	 * @param array $jobs
	 * @return int
	 */
	public static function pushJobs( $jobs ) {
		$count = count( $jobs );
		if ( !$count ) {
			return 0;
		}
		$services = MediaWikiServices::getInstance();
		if ( method_exists( $services, 'getJobQueueGroup' ) ) {
			// MW 1.37+
			$services->getJobQueueGroup()->push( $jobs );
		} else {
			JobQueueGroup::singleton()->push( $jobs );
		}

		return $count;
	}

	/**
	 * @see includes/specials/SpecialChangeContentModel.php
	 * @return array
	 */
	public static function getContentModels() {
		$services = MediaWiki\MediaWikiServices::getInstance();
		$contentHandlerFactory = $services->getContentHandlerFactory();
		$models = $contentHandlerFactory->getContentModels();
		$options = [];

		foreach ( $models as $model ) {
			$handler = $contentHandlerFactory->getContentHandler( $model );

			if ( !$handler->supportsDirectEditing() ) {
				continue;
			}

			$options[ ContentHandler::getLocalizedName( $model ) ] = $model;
		}

		ksort( $options );

		return $options;
	}

	/**
	 * @param Title $title
	 * @return array
	 */
	public static function getTrackingCategories( $title ) {
		if ( !$title || !$title->isKnown() ) {
			return [];
		}

		$services = MediaWikiServices::getInstance();
		if ( method_exists( $services, 'getTrackingCategories' ) ) {
			$trackingCategoriesClass = $services->getTrackingCategories();
			$trackingCategories = $trackingCategoriesClass->getTrackingCategories();

		} else {
			$context = RequestContext::getMain();
			$config = $context->getConfig();
			$trackingCategories = new TrackingCategories( $config );
		}

		$ret = [];
		foreach ( $trackingCategories as $value ) {
			foreach ( $value['cats'] as $title_ ) {
				$ret[] = $title_->getText();
			}
		}
		return $ret;
	}

	/**
	 * @param Title $title
	 * @param int $mode 2
	 * @return array
	 */
	public static function getCategories( $title, $mode = 2 ) {
		if ( !$title || !$title->isKnown() ) {
			return [];
		}

		$wikiPage = self::getWikiPage( $title );
		$arr = $wikiPage->getCategories();
		$ret = [];
		foreach ( $arr as $title_ ) {
			$ret[] = $title_->getText();
		}

		switch ( $mode ) {
			// all categories
			case 1:
				return $ret;

			case 2:
				// remove tracking categories
				$trackingCategories = self::getTrackingCategories( $title );
				foreach ( $ret as $key => $category ) {
					if ( in_array( $category, $trackingCategories ) ) {
						unset( $ret[$key] );
					}
				}

				// remove categories annotated on the page,
				// since we will not tinker with wikitext
				$jsonData = self::getJsonData( $title );
				if ( !empty( $jsonData['categories'] ) ) {
					foreach ( $ret as $key => $category ) {
						if ( !in_array( $category, $jsonData['categories'] ) ) {
							unset( $ret[$key] );
						}
					}
				}
				break;

			// only tracking categories
			case 3:
				$trackingCategories = self::getTrackingCategories( $title );
				foreach ( $ret as $key => $category ) {
					if ( !in_array( $category, $trackingCategories ) ) {
						unset( $ret[$key] );
					}
				}
				break;
		}

		return array_values( $ret );
	}

	/**
	 * @return Importer|Importer1_35|null
	 */
	public static function getImporter() {
		$services = MediaWikiServices::getInstance();

		if ( version_compare( MW_VERSION, '1.42', '>=' ) ) {
			include_once __DIR__ . '/importer/VisualDataImporter1_42.php';

			// @see WikiImporterFactory.php -> getWikiImporter
			$performer = RequestContext::getMain()->getAuthority();
			return new VisualDataImporter1_42(
				$performer,
				$services->getMainConfig(),
				$services->getHookContainer(),
				$services->getContentLanguage(),
				$services->getNamespaceInfo(),
				$services->getTitleFactory(),
				$services->getWikiPageFactory(),
				$services->getWikiRevisionUploadImporter(),
				$services->getContentHandlerFactory(),
				$services->getSlotRoleRegistry()
			);

		} elseif ( version_compare( MW_VERSION, '1.37', '>=' ) ) {
			include_once __DIR__ . '/importer/VisualDataImporter.php';

			// @see ServiceWiring.php -> WikiImporterFactory
			return new VisualDataImporter(
				$services->getMainConfig(),
				$services->getHookContainer(),
				$services->getContentLanguage(),
				$services->getNamespaceInfo(),
				$services->getTitleFactory(),
				$services->getWikiPageFactory(),
				$services->getWikiRevisionUploadImporter(),
				$services->getPermissionManager(),
				$services->getContentHandlerFactory(),
				$services->getSlotRoleRegistry()
			);
		}

		include_once __DIR__ . '/importer/VisualDataImporter1_35.php';
		return new VisualDataImporter1_35( $services->getMainConfig() );
	}

	/**
	 * @param User $user
	 * @return array
	 */
	public static function getUserGroups( $user ) {
		if ( !self::$userGroupManager ) {
			self::initialize();
		}
		$UserGroupManager = self::$userGroupManager;

		$user_groups = array_unique( array_merge(
			$UserGroupManager->getUserEffectiveGroups( $user ),
			$UserGroupManager->getUserImplicitGroups( $user )
		) );
		// $key = array_search( '*', $user_groups );
		// $user_groups[ $key ] = 'all';
		return $user_groups;
	}

	/**
	 * @param Title $title
	 * @param bool $exclude_current
	 * @return array
	 */
	public static function page_ancestors( $title, $exclude_current = true ) {
		$output = [];

		$title_parts = explode( '/', $title->getText() );

		if ( $exclude_current ) {
			array_pop( $title_parts );
		}

		$path = [];

		foreach ( $title_parts as $value ) {
			$path[] = $value;
			$title_text = implode( '/', $path );

			if ( $title->getText() == $title_text ) {
				$output[] = $title;

			} else {
				$title_ = Title::newFromText( $title_text );
				if ( $title_ && $title_->isKnown() ) {
					$output[] = $title_;
				}
			}
		}

		return $output;
	}

	/**
	 * @see https://gerrit.wikimedia.org/r/plugins/gitiles/mediawiki/extensions/PageOwnership/+/refs/heads/master/includes/PageOwnership.php
	 * @param Title $title
	 * @param null|int $limit null
	 * @return array
	 */
	public static function getTransclusionTargets( $title, $limit = null ) {
		$context = RequestContext::getMain();
		$config = $context->getConfig();
		$options = [ 'LIMIT' => $limit ?? $config->get( 'PageInfoTransclusionLimit' ) ];

		if ( version_compare( MW_VERSION, '1.39', '<' ) ) {
			return self::getLinksTo( $title, $options, 'templatelinks', 'tl' );
		}

		return $title->getTemplateLinksTo( $options );
	}

	/**
	 * @see MediaWiki\Title -> getLinksTo
	 * @param Title $title
	 * @param array $options
	 * @param string $table
	 * @param string $prefix
	 * @return void
	 */
	public static function getLinksTo( $title, $options = [], $table = 'pagelinks', $prefix = 'pl' ) {
		if ( count( $options ) > 0 ) {
			$db = self::getDB( DB_PRIMARY );
		} else {
			$db = self::getDB( DB_REPLICA );
		}

		$res = $db->select(
			[ 'page', $table ],
			LinkCache::getSelectFields(),
			[
				"{$prefix}_from=page_id",
				// ***edited
				"{$prefix}_namespace" => $title->getNamespace(),
				"{$prefix}_title" => $title->getDBkey() ],
			__METHOD__,
			$options
		);

		$retVal = [];
		if ( $res->numRows() ) {
			// $linkCache = MediaWikiServices::getInstance()->getLinkCache();
			foreach ( $res as $row ) {
				// ***edited
				// $titleObj = self::makeTitle( $row->page_namespace, $row->page_title );
				$titleObj = Title::newFromID( $row->page_id );
				if ( $titleObj ) {
					// $linkCache->addGoodLinkObjFromRow( $titleObj, $row );
					$retVal[] = $titleObj;
				}
			}
		}
		return $retVal;
	}

	/**
	 * @see specials/SpecialPrefixindex.php -> showPrefixChunk
	 * @param string $prefix
	 * @param int $namespace
	 * @return array
	 */
	public static function getPagesWithPrefix( $prefix, $namespace = NS_MAIN ) {
		$dbr = self::getDB( DB_REPLICA );

		$conds = [
			'page_namespace' => $namespace,
			'page_is_redirect' => 0
		];

		if ( !empty( $prefix ) ) {
			$conds[] = 'page_title' . $dbr->buildLike( $prefix, $dbr->anyString() );
		}

		$res = $dbr->select(
			'page',
			[ 'page_namespace', 'page_title', 'page_id' ],
			$conds,
			__METHOD__,
			[
				'LIMIT' => self::$queryLimit,
				'ORDER BY' => 'page_title',
				// @see here https://doc.wikimedia.org/mediawiki-core/
				'USE INDEX' => ( version_compare( MW_VERSION, '1.36', '<' ) ? 'name_title' : 'page_name_title' ),
			]
		);

		if ( !$res->numRows() ) {
			return [];
		}

		$ret = [];
		foreach ( $res as $row ) {
			$title = Title::newFromRow( $row );

			if ( !$title->isKnown() ) {
				continue;
			}

			$ret[] = $title;
		}

		return $ret;
	}

	/**
	 * @see api/ApiMove.php => MovePage
	 * @param User $user
	 * @param Title $from
	 * @param Title $to
	 * @param string|null $reason
	 * @param bool $createRedirect
	 * @param array $changeTags
	 * @return Status
	 */
	public static function movePage( $user, Title $from, Title $to, $reason = null, $createRedirect = false, $changeTags = [] ) {
		$movePageFactory = MediaWikiServices::getInstance()->getMovePageFactory();
		$mp = $movePageFactory->newMovePage( $from, $to );
		$valid = $mp->isValidMove();

		if ( !$valid->isOK() ) {
			return $valid;
		}

		// ***edited
		if ( method_exists( MovePage::class, 'authorizeMove' ) ) {
			$permStatus = $mp->authorizeMove( $user, $reason );
		} else {
			$permStatus = $mp->checkPermissions( $user, $reason );
		}

		if ( !$permStatus->isOK() ) {
			return $permStatus;
		}

		// Check suppressredirect permission
		// if ( !$this->getAuthority()->isAllowed( 'suppressredirect' ) ) {
		//	$createRedirect = true;
		// }

		// ***edited
		$status = $mp->move( $user, $reason, $createRedirect, $changeTags );

		if ( $status->isOK() ) {
			// update cache
			$from_text = $from->getFullText();
			if ( array_key_exists( $from_text, self::$cachedJsonData ) ) {
				self::$cachedJsonData[ $to->getFullText() ] = self::$cachedJsonData[ $from_text ];
				unset( self::$cachedJsonData[ $from_text ] );
			}
		}

		return $status;
	}

	/**
	 * @param Wikipage $wikipage
	 * @param User $user
	 * @param string $reason
	 * @return void
	 */
	public static function deletePage( $wikipage, $user, $reason ) {
		if ( version_compare( MW_VERSION, '1.35', '<' ) ) {
			$error = '';
			$wikipage->doDeleteArticle( $reason, false, null, null, $error, $user );
		} else {
			$wikipage->doDeleteArticleReal( $reason, $user );
		}
	}

	/**
	 * @param User $user
	 * @param Title $title
	 * @param string $text
	 * @return bool
	 */
	public static function saveRevision( $user, $title, $text ) {
		$wikiPage = self::getWikiPage( $title );
		$pageUpdater = $wikiPage->newPageUpdater( $user );
		$slotRoleRegistry = MediaWikiServices::getInstance()->getSlotRoleRegistry();
		$modelId = $slotRoleRegistry->getRoleHandler( SlotRecord::MAIN )->getDefaultModel( $title );

		$slotContent = ContentHandler::makeContent( $text, $title, $modelId );
		$pageUpdater->setContent( MediaWiki\Revision\SlotRecord::MAIN, $slotContent );

		$summary = '';
		$flags = EDIT_INTERNAL;
		$comment = CommentStoreComment::newUnsavedComment( $summary );
		$newRevision = $pageUpdater->saveRevision( $comment, $flags );
		$status = $pageUpdater->getStatus();

		return $status->isOK();
	}

	/**
	 * @param Title $title
	 * @return string|null
	 */
	public static function getWikipageContent( $title ) {
		$wikiPage = self::getWikiPage( $title );
		if ( !$wikiPage ) {
			return null;
		}
		$content = $wikiPage->getContent( \MediaWiki\Revision\RevisionRecord::RAW );
		if ( !$content ) {
			return null;
		}
		return $content->getNativeData();
	}

	/**
	 * @param Title $title
	 * @return MediaWiki\Revision\RevisionRecord|null
	 */
	public static function revisionRecordFromTitle( $title ) {
		$wikiPage = self::getWikiPage( $title );

		if ( $wikiPage ) {
			return $wikiPage->getRevisionRecord();
		}
		return null;
	}

	/**
	 * @param array $arr
	 * @see https://stackoverflow.com/questions/173400/how-to-check-if-php-array-is-associative-or-sequential
	 * @return bool
	 */
	public static function isList( $arr ) {
		if ( function_exists( 'array_is_list' ) ) {
			return array_is_list( $arr );
		}
		if ( $arr === [] ) {
			return true;
		}
		return array_keys( $arr ) === range( 0, count( $arr ) - 1 );
	}

	/**
	 * @see https://www.php.net/manual/en/function.array-merge-recursive.php
	 * @param array &$arr1
	 * @param array &$arr2
	 * @return array
	 */
	public static function array_merge_recursive( &$arr1, &$arr2 ) {
		$ret = $arr1;
		foreach ( $arr2 as $key => &$value ) {
			if ( is_array( $value ) && isset( $ret[$key] )
				&& is_array( $ret[$key] ) ) {
				$ret[$key] = self::array_merge_recursive( $ret[$key], $value );
			} else {
				$ret[$key] = $value;
			}
		}
		return $ret;
	}

	/**
	 * @param int $db
	 * @return \Wikimedia\Rdbms\DBConnRef
	 */
	public static function getDB( $db ) {
		if ( !method_exists( MediaWikiServices::class, 'getConnectionProvider' ) ) {
			// @see https://gerrit.wikimedia.org/r/c/mediawiki/extensions/PageEncryption/+/1038754/comment/4ccfc553_58a41db8/
			return MediaWikiServices::getInstance()->getDBLoadBalancer()->getConnection( $db );
		}
		$connectionProvider = MediaWikiServices::getInstance()->getConnectionProvider();
		switch ( $db ) {
			case DB_PRIMARY:
			// phpcs:ignore MediaWiki.Usage.DeprecatedConstantUsage.DB_MASTER
			case DB_MASTER:
				return $connectionProvider->getPrimaryDatabase();
			case DB_REPLICA:
			default:
				return $connectionProvider->getReplicaDatabase();
		}
	}
}
