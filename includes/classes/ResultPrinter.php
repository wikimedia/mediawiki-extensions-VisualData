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
 * @copyright Copyright ©2024-2025, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData;

use MediaWiki\Extension\Scribunto\Engines\LuaStandalone\LuaStandaloneEngine;
use MediaWiki\Extension\VisualData\Aliases\Title as TitleClass;
use MediaWiki\MediaWikiServices;
use MWException;
use Parser;

class ResultPrinter {

	/** @var array */
	protected $modules = [];

	/** @var User */
	protected $user;

	/** @var Output */
	protected $output;

	/** @var string */
	private $format;

	/** @var Parser */
	public $parser;

	/** @var QueryProcessor */
	public $queryProcessor;

	/** @var string */
	public $separator = '';

	/** @var string */
	public $valuesSeparator = ', ';

	/** @var array */
	public $params;

	/** @var string */
	public $schema;

	/** @var array */
	public $printouts;

	/** @var array */
	public $printoutsOptions;

	/** @var array */
	public $templates;

	/** @var array */
	protected $mapPathSchema = [];

	/** @var array */
	public static $titleAliases = [
		'_title',
		'title',
		'_pagetitle',
		'pagetitle'
	];

	/** @var array */
	public static $categoriesAliases = [
		'_categories',
		'categories',
		'_cats',
		'cats'
	];

	/** @var array */
	public static $pageidAliases = [
		'_pageid',
		'pageid',
		'articleid',
		'_articleid',
	];

	/** @var array */
	public static $parametersAlias = [
		'params',
		'_params'
	];

	/** @var array */
	public static $isFirstAlias = [
		'isfirst',
		'_isfirst'
	];

	/** @var array */
	public static $isLastAlias = [
		'islast',
		'_islast'
	];

	/**
	 * @param Parser $parser
	 * @param User $user
	 * @param Output $output
	 * @param QueryProcessor $queryProcessor
	 * @param array $schema
	 * @param array $templates
	 * @param array $params
	 * @param array $printouts
	 * @param array $printoutsOptions []
	 */
	public function __construct( $parser, $user, $output, $queryProcessor, $schema, $templates, $params, $printouts, $printoutsOptions = [] ) {
		// *** do not discard original entries,
		// only ensure default parameters exist
		// when internally called from VisualData -> getResults
		$defaultParameters = $this->getDefaultParameters();
		$params = array_merge( $params,
			\VisualData::applyDefaultParams( $defaultParameters, $params ) );

		$this->queryProcessor = $queryProcessor;
		$this->user = $user;
		$this->format = $params['format'];
		$this->params = $params;
		$this->schema = $schema;
		$this->parser = $parser;
		$this->output = $output;
		$this->printouts = $printouts;
		$this->printoutsOptions = $printoutsOptions;
		$this->templates = $templates;
		$this->valuesSeparator = $params['values-separator'] ?? $this->valuesSeparator;
		$this->separator = $params['separator'];
	}

	/**
	 * @return bool
	 */
	public function isHtml() {
		return true;
	}

	/**
	 * @return string
	 */
	public function getResults() {
		$results = $this->queryProcessor->getResults();
		if ( count( $this->queryProcessorErrors() ) ) {
			return implode( ', ', $this->queryProcessorErrors() );
		}
		if ( $this->params['debug'] ) {
			return $results;
		}
		return $this->processResults( $results, $this->schema );
	}

	/**
	 * @param Title|Mediawiki\Title\Title $title
	 * @param array $value
	 * @param array $categories
	 * @return string
	 */
	public function processRow( $title, $value, $categories ) {
		$path = '';
		return $this->processSchemaRec( $title, $this->schema, $value, $categories, $path );
	}

	/**
	 * @param Title|Mediawiki\Title\Title $title
	 * @param array $value
	 * @param array $categories
	 * @return string
	 */
	public function processRowTree( $title, $value, $categories ) {
		$path = '';
		$pathNoIndex = '';
		return $this->processSchemaRecTree( $title, $this->schema, $value, $categories, $path, $pathNoIndex );
	}

	/**
	 * @param array $results
	 * @param array $schema
	 * @return string
	 */
	public function processResults( $results, $schema ) {
		$ret = [];
		foreach ( $results as $value ) {
			[ $title_, $row, $categories ] = $value;
			if ( $title_->isSpecial( 'Badtitle' ) ) {
				continue;
			}
			$ret[] = $this->processRow( $title_, $row, $categories );
		}

		return $this->processRoot( $ret );
	}

	/**
	 * @param array $rows
	 * @return string
	 */
	public function processRoot( $rows ) {
		return implode( '', $rows );
	}

	/**
	 * @param string $titleStr
	 * @param array $params
	 * @return string
	 */
	protected function processTemplate( $titleStr, $params ) {
		$titleTemplate = TitleClass::makeTitle( NS_TEMPLATE,
			TitleClass::capitalize( $titleStr, NS_TEMPLATE ) );

		if ( !$titleTemplate || !$titleTemplate->isKnown() ) {
			return "[[$titleTemplate]]";
		}

		// @see \MediaWiki\Extension\Scribunto\Engines\LuaCommon\LuaEngine::expandTemplate
		if ( class_exists( 'MediaWiki\Extension\Scribunto\Engines\LuaStandalone\LuaStandaloneEngine' ) ) {
			$args = $params;
			$titleText = $titleStr;
			$luaStandaloneEngine = new LuaStandaloneEngine( [
				'parser' => $this->parser,
				'title' => $this->parser->getTitle()
			] );
			$frameId = 'empty';
			$text = $luaStandaloneEngine->expandTemplate( $frameId, $titleText, $args );
			return $text[0];
		}

		// @see \MediaWiki\Extension\Scribunto\Engines\LuaCommon\LuaEngine
		$args = $params;
		return $this->expandTemplate( $titleTemplate, $args );

		// *** this does not seem to work in all cases, specifically
		// https://wikisphere.org/w/index.php?title=Country_page&pageid=710
		// $argv = [];
		// foreach ( $params as $key => $value ) {
		// 	// escpae pipe character !!
		// 	$value = str_replace( '|', '&#124;', (string)$value );
		// 	$argv[] = "$key=$value";
		// }

		// $text = '{{' . $titleTemplate . '|' . implode( '|', $argv ) . '}}';
		// return $this->parser->recursiveTagParse( $text );
	}

	/**
	 * @see \MediaWiki\Extension\Scribunto\Engines\LuaCommon\LuaEngine
	 * @param Title|Mediawiki\Title\Title $title
	 * @param array $args
	 * @return array
	 */
	public function expandTemplate( $title, $args ) {
		$titleText = $title->getText();
		$frame = $this->parser->getPreprocessor()->newFrame();

		if ( $frame->depth >= $this->parser->getOptions()->getMaxTemplateDepth() ) {
			throw new MWException( 'expandTemplate: template depth limit exceeded' );
		}

		if ( MediaWikiServices::getInstance()->getNamespaceInfo()->isNonincludable( $title->getNamespace() ) ) {
			throw new MWException( 'expandTemplate: template inclusion denied' );
		}

		[ $dom, $finalTitle ] = $this->parser->getTemplateDom( $title );
		if ( $dom === false ) {
			throw new MWException( "expandTemplate: template \"$titleText\" does not exist" );
		}

		if ( !$frame->loopCheck( $finalTitle ) ) {
			throw new MWException( 'expandTemplate: template loop detected' );
		}

		$fargs = $this->parser->getPreprocessor()->newPartNodeArray( $args );
		$newFrame = $frame->newChild( $fargs, $finalTitle );
		// $text = $this->doCachedExpansion( $newFrame, $dom,
		// 	[
		// 		'frameId' => $frameId,
		// 		'frameId' => 'empty',
		// 		'template' => $finalTitle->getPrefixedDBkey(),
		// 		'args' => $fargs
		// 	]
		// );
		$text = $newFrame->expand( $dom );
		return $text;
	}

	/**
	 * @param Title|Mediawiki\Title\Title $title
	 * @param string $path
	 * @param array $arr
	 * @param array $categories
	 * @param bool $isFirst
	 * @param bool $isLast
	 * @return array
	 */
	protected function getTemplateParams( $title, $path, $arr, $categories, $isFirst = true, $isLast = true ) {
		$ret = [];
		$flattenRec = static function ( $arr, $path = '' ) use ( &$ret, &$flattenRec ) {
			foreach ( $arr as $key => $value ) {
				if ( is_array( $value ) ) {
					$flattenRec( $value, $key );
				} else {
					$ret[$path ? "$path/$key" : $key] = $value;
				}
			}
		};
		$flattenRec( $arr );

		$thisClass = $this;
		$replaceAliases = static function ( $arr, $str ) use( &$ret, $path, $thisClass ) {
			foreach ( $arr as $text ) {
				if ( !in_array( $path ? "$path/$text" : $text, $thisClass->getValidPrintouts() ) ) {
					$ret[$text] = $str;
				}
			}
		};

		// use the title, pageid and categories aliases only
		// when do not conflict with printout names
		$replaceAliases( self::$titleAliases, $title->getFullText() );
		$replaceAliases( self::$categoriesAliases, implode( ', ', $categories ) );
		$replaceAliases( self::$pageidAliases, $title->getArticleID() );

		foreach ( self::$isFirstAlias as $text ) {
			$ret[$text] = $isFirst;
		}

		foreach ( self::$isLastAlias as $text ) {
			$ret[$text] = $isLast;
		}

		$retCopy = $ret;
		foreach ( self::$parametersAlias as $text ) {
			if ( !in_array( $path ? "$path/$text" : $text, $this->getValidPrintouts() ) ) {
				$ret[$text] = '<pre>' . json_encode( $retCopy, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES )
					. '</pre>';
			}
		}

		return $ret;
	}

	/**
	 * @param Title|Mediawiki\Title\Title $title
	 * @param array $schema
	 * @param array $arr
	 * @param array $categories
	 * @param string $path
	 * @param string $pathNoIndex
	 * @param bool $isFirst true
	 * @param bool $isLast true
	 * @return string
	 */
	protected function processSchemaRecTree( $title, $schema, $arr, $categories, $path, $pathNoIndex, $isFirst = true, $isLast = true ) {
		$isArray = $schema['type'] === 'array';

		// reset indexes
		if ( $isArray ) {
			$arr = array_values( $arr );
		}

		$ret = [];
		$recPaths = [];
		$n = 0;
		foreach ( $arr as $key => $value ) {
			$currentPath = $path ? "$path/$key" : $key;

			// passed as template params
			$isFirst_ = ( $n === 0 );
			$isLast_ = ( $n === count( $arr ) - 1 );
			$n++;

			switch ( $schema['type'] ) {
				case 'object':
					$subschema = [];
					if ( array_key_exists( $key, $schema['properties'] ) ) {
						$subschema = $schema['properties'][$key];
					}
					$currentPathNoIndex = $pathNoIndex ? "$pathNoIndex/$key" : $key;
					break;
				case 'array':
					$currentPathNoIndex = $pathNoIndex;
					// @FIXME handle tuple
					$subschema = $schema['items'];
					break;
				default:
					if ( !array_key_exists( $key, $schema ) ) {
						continue 2;
					}
					$subschema = $schema[$key];
			}

			if ( is_array( $value ) ) {
				[ $ret[$key], $recPaths ] = $this->processSchemaRecTree( $title, $subschema, $value, $categories, $currentPath, $currentPathNoIndex, $isFirst_, $isLast_ );

			} else {
				$ret[$key] = $this->processChild(
					$title,
					$subschema,
					$key,
					$arr,
					$categories,
					$currentPathNoIndex,
					$isArray,
					$isFirst_,
					$isLast_
				);

				$recPaths[$currentPath] = $ret[$key];
			}
		}

		$res = [
			$this->processParent( $title, $schema, $ret, $categories, $pathNoIndex, $recPaths, $isFirst, $isLast ),
			$recPaths
		];

		return ( $pathNoIndex === '' ? $res[0] : $res );
	}

	/**
	 * @param Title|Mediawiki\Title\Title $title
	 * @param array $schema
	 * @param array $arr
	 * @param array $categories
	 * @param string $path
	 * @param bool $isFirst true
	 * @param bool $isLast true
	 * @return string
	 */
	protected function processSchemaRec( $title, $schema, $arr, $categories, $path, $isFirst = true, $isLast = true ) {
		$isArray = ( $schema['type'] === 'array' );

		$ret = [];
		$recPaths = [];
		$n = 0;
		foreach ( $arr as $key => $value ) {
			$currentPath = $path ? "$path/$key" : $key;

			// passed as template params
			$isFirst_ = ( $n === 0 );
			$isLast_ = ( $n === count( $arr ) - 1 );
			$n++;

			switch ( $schema['type'] ) {
				case 'object':
					$subschema = [];
					if ( array_key_exists( $key, $schema['properties'] ) ) {
						$subschema = $schema['properties'][$key];
					}
					break;
				case 'array':
					// @FIXME handle tuple
					// the source array does not contain indexes
					if ( !array_key_exists( $key, $schema['items']['properties'] ) ) {
						continue 2;
					}
					$subschema = $schema['items']['properties'][$key];
					break;
				default:
					if ( !array_key_exists( $key, $schema ) ) {
						continue 2;
					}
					$subschema = $schema[$key];
			}

			if ( is_array( $value ) ) {
				[ $ret[$key], $recPaths ] = $this->processSchemaRec( $title, $subschema, $value, $categories, $currentPath, $isFirst_, $isLast_ );
			} else {
				$ret[$key] = $this->processChild(
					$title,
					$subschema,
					$key,
					$arr,
					$categories,
					$currentPath,
					$isArray,
					$isFirst_,
					$isLast,
				);
				$recPaths[$currentPath] = $ret[$key];
			}
		}

		$res = [
			$this->processParent( $title, $schema, $ret, $categories, $path, $recPaths, $isFirst, $isLast ),
			$recPaths
		];

		return ( $path === '' ? $res[0] : $res );
	}

	/**
	 * @param Title|Mediawiki\Title\Title $title
	 * @param array $schema
	 * @param array $properties
	 * @param array $categories
	 * @param string $path
	 * @param array $recPaths
	 * @param bool $isFirst
	 * @param bool $isLast
	 * @return string
	 */
	public function processParent( $title, $schema, $properties, $categories, $path, $recPaths, $isFirst, $isLast ) {
		$isArray = ( $schema['type'] === 'array' );
		$isRoot = ( $path === '' );

		if ( $isArray ) {
			return implode( !$this->hasTemplate( $path ) ?
				$this->valuesSeparator : '', $properties );
		}

		$ret = '';
		if ( $this->hasTemplate( $path ) ) {
			$properties_ = array_merge( $properties, $recPaths );
			$ret = $this->processTemplate( $this->templates[$path],
				$this->getTemplateParams( $title, $path, $properties_, $categories, $isFirst, $isLast ) );

		} else {
			// *** the cleaning here has no effect
			// for TableResultPrinter since the columns
			// are added to the table from the children
			// $properties = array_intersect_key( $properties, array_filter( $this->printouts ) );
			$ret = implode( $this->separator ?? '', $properties );
		}

		if ( $this->isHtml() && $isRoot ) {
			return Parser::stripOuterParagraph(
				$this->parser->recursiveTagParseFully( $ret )
			);
		}

		return $ret;
	}

	/**
	 * @param string $path
	 * @return bool
	 */
	public function hasTemplate( $path ) {
		return array_key_exists( $path, $this->templates )
			&& !empty( $this->templates[$path] );
	}

	/**
	 * @param Title|Mediawiki\Title\Title $title
	 * @param array|null $schema
	 * @param string $key
	 * @param array $properties
	 * @param array $categories
	 * @param string $path
	 * @param bool $isArray
	 * @param bool $isFirst
	 * @param bool $isLast
	 * @return string
	 */
	public function processChild( $title, $schema, $key, $properties, $categories, $path, $isArray, $isFirst, $isLast ) {
		$value = $properties[$key];

		// apply template
		if ( $this->hasTemplate( $path ) ) {
			if ( $isArray ) {
				// @TODO verify that json pointer is unescaped
				$arr_ = explode( '/', $path );
				$properties = [ array_pop( $arr_ ) => $value ];
			}
			$value = $this->processTemplate( $this->templates[$path],
				$this->getTemplateParams( $title, $path, $properties, $categories, $isFirst, $isLast ), false );
		}

		$value = (string)$value;

		// @ATTENTION in tree mode $key will be an integer and $path/$properties
		// are unrelated from categories, however doesn't seem to be a reason
		// to handle this in processParent outside the processTemplate method
		$thisClass = $this;
		$replaceAlias = static function ( $arr, $str ) use( $thisClass, $isArray, $key, &$value ) {
			if ( !$isArray
				&& empty( $value )
				&& !in_array( $key, $thisClass->getValidPrintouts() )
				&& in_array( $key, $arr )
			) {
				$value = $str;
			}
		};

		$replaceAlias( self::$titleAliases, $title->getFullText() );
		$replaceAlias( self::$categoriesAliases, implode( ', ', $categories ) );

		return $value;
	}

	/**
	 * @param array $result
	 * @return array
	 */
	public function returnRawResult( $result ) {
		if ( !count( $result ) ) {
			return [];
		}
		return ( !$this->queryProcessor->isPrintCondition() ? $result : $result[0] );
	}

	/**
	 * @return array
	 */
	public function getValidPrintouts() {
		return $this->queryProcessor->getValidPrintouts();
	}

	/**
	 * @return array
	 */
	public function queryProcessorErrors() {
		return $this->queryProcessor->getErrors();
	}

	/**
	 * @return int
	 */
	public function getCount() {
		return $this->queryProcessor->getCount();
	}

	/**
	 * @return array
	 */
	public function getModules() {
		return $this->modules;
	}

	/**
	 * @return array
	 */
	public function getDefaultParameters() {
		// @see \VisualData -> parserFunctionQuery
		$ret = \VisualData::$QueryDefaultParameters;

		array_walk( $ret, static function ( &$value, $key ) {
			$value = [ $value['default'], $value['type'] ];
		} );

		$ret['function'] = [ 'query', 'string' ];

		return $ret;
	}

	/**
	 * @param string|null $prefix null
	 * @return array
	 */
	public function getFormattedParams( $prefix = null ) {
		$params = [];
		if ( $prefix ) {
			foreach ( $this->params as $key => $value ) {
				if ( strpos( $key, $prefix ) === 0 ) {
					$ret[str_replace( $prefix, '', $key )] = $value;
				}
			}

		} else {
			$params = $this->params;
			$defaultParameters = $this->getDefaultParameters();
			foreach ( $params as $key => $value ) {
				if ( array_key_exists( $key, $defaultParameters ) ) {
					unset( $params[$key] );
				}
			}
		}

		$ret = [];

		// convert strings like "columns.searchPanes.show"
		// to nested objects
		foreach ( $params as $key => $value ) {
			if ( strpos( $key, '.' ) === false ) {
				$ret[$key] = $value;
				continue;
			}

			$parts = explode( '.', $key );
			// \VisualData::array_merge_recursive will remove the parent
			// value, however we rather use it to enable/disable the options' set
			$ret = \VisualData::array_merge_recursive(
				$ret,
				$this->plainToNestedObj( $parts, $value )
			);
		}

		// used in congjunction with array_merge_recursive
		// where the parent is disabled with eg. searchpanes = false
		foreach ( $ret as $key => $value ) {
			if ( \VisualData::isAssoc( $value ) && array_key_exists( 0, $value ) ) {
				if ( $value[0] === false ) {
					unset( $ret[$key] );
				} else {
					unset( $ret[$key][0] );
				}
			}
		}

		return $ret;
	}

	/**
	 * @see https://github.com/SemanticMediaWiki/SemanticResultFormats/blob/master/formats/datatables/DataTables.php
	 * @param array $arr
	 * @param string $value
	 * @return array
	 */
	private function plainToNestedObj( $arr, $value ) {
		$ret = [];

		// link to first level
		$t = &$ret;
		foreach ( $arr as $key => $k ) {
			if ( !array_key_exists( $k, $t ) ) {
				$t[$k] = [];
			}
			// link to deepest level
			$t = &$t[$k];
			if ( $key === count( $arr ) - 1 ) {
				$t = $value;
			}
		}
		return $ret;
	}

}
