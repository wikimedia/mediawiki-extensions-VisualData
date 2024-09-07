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
 * @copyright Copyright ©2023, https://wikisphere.org
 */

namespace MediaWiki\Extension\VisualData;

use MediaWiki\Extension\Scribunto\Engines\LuaStandalone\LuaStandaloneEngine;
use MediaWiki\MediaWikiServices;

class ResultPrinter {

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
	public $validPrintouts;

	/** @var array */
	protected $mapPathSchema = [];

	/**
	 * @param Parser $parser
	 * @param Output $output
	 * @param QueryProcessor $queryProcessor
	 * @param array $schema
	 * @param array $templates
	 * @param array $params
	 * @param array $printouts
	 * @param array $printoutsOptions []
	 */
	public function __construct( $parser, $output, $queryProcessor, $schema, $templates, $params, $printouts, $printoutsOptions = [] ) {
		$this->queryProcessor = $queryProcessor;

		$defaultParameters = [
			'format' => [ 'json', 'string' ],
			'schema' => [ '', 'string' ],
			'separator' => [ '', 'string' ],
			'values-separator' => [ ', ', 'string' ],
			'template' => [ '', 'string' ],
			'module' => [ '', 'string' ],
			'pagetitle' => [ 'page title', 'string' ]
		];

		// *** do not discard original entries,
		// only ensure default parameters exist
		// when internally called from VisualData -> getResults
		$params = array_merge( $params,
			\VisualData::applyDefaultParams( $defaultParameters, $params ) );

		$this->format = $params['format'];
		$this->params = $params;
		$this->schema = $schema;
		$this->parser = $parser;
		$this->output = $output;
		$this->printouts = $printouts;
		$this->printoutsOptions = $printoutsOptions;
		$this->templates = $templates;
		$this->valuesSeparator = $params['values-separator'];
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
		$this->validPrintouts = $this->queryProcessor->getValidPrintouts();
		return $this->processResults( $results, $this->schema );
	}

	/**
	 * @param Title $title
	 * @param array $value
	 * @return string
	 */
	public function processRow( $title, $value ) {
		$path = '';
		return $this->processSchemaRec( $title, $this->schema, $value, $path );
	}

	/**
	 * @param Title $title
	 * @param array $value
	 * @return string
	 */
	public function processRowTree( $title, $value ) {
		$path = '';
		$pathNoIndex = '';
		return $this->processSchemaRecTree( $title, $this->schema, $value, $path, $pathNoIndex );
	}

	/**
	 * @param array $results
	 * @param array $schema
	 * @return string
	 */
	public function processResults( $results, $schema ) {
		$ret = [];
		foreach ( $results as $value ) {
			[ $title_, $row ] = $value;
			$ret[] = $this->processRow( $title_, $row );
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
		$titleTemplate = \Title::makeTitle( NS_TEMPLATE,
			\Title::capitalize( $titleStr, NS_TEMPLATE ) );

		if ( !$titleTemplate || !$titleTemplate->isKnown() ) {
			return "[[$titleTemplate]]";
		}

		// @see Scribunto_LuaEngine -> expandTemplate
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

		// @see Scribunto_LuaEngine
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
	 * @see Scribunto_LuaEngine
	 * @param Title $title
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
	 * @param Title $title
	 * @param string $path
	 * @param array $arr
	 * @return array
	 */
	protected function getTemplateParams( $title, $path, $arr ) {
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
		$keys = [
			'_pagetitle' => $title->getFullText(),
			'_articleid' => $title->getArticleID()
		];

		$keys['pagetitle'] = $keys['_pagetitle'];
		$keys['articleid'] = $keys['_articleid'];

		// if "pagetitle" is not a valid printout
		// it won't be overwritten, and _pagetitle should
		// be used instead
		foreach ( $keys as $k => $v ) {
			if ( !in_array( $path ? "$path/$k" : $k, $this->validPrintouts ) ) {
				$ret[$k] = $v;
			}
		}

		return $ret;
	}

	/**
	 * @param Title $title
	 * @param array $schema
	 * @param array $arr
	 * @param string $path
	 * @param string $pathNoIndex
	 * @return string
	 */
	protected function processSchemaRecTree( $title, $schema, $arr, $path, $pathNoIndex ) {
		$isArray = $schema['type'] === 'array';

		// reset indexes
		if ( $isArray ) {
			$arr = array_values( $arr );
		}
		$ret = [];
		$recPaths = [];
		foreach ( $arr as $key => $value ) {
			$currentPath = $path ? "$path/$key" : $key;

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
				[ $ret[$key], $recPaths ] = $this->processSchemaRecTree( $title, $subschema, $value, $currentPath, $currentPathNoIndex );

			} else {
				$ret[$key] = $this->processChild(
					$title,
					$subschema,
					$key,
					$arr,
					$currentPathNoIndex,
					$path === ''
				);

				$recPaths[$currentPath] = $ret[$key];
			}
		}

		$res = [
			$this->processParent( $title, $schema, $ret, $pathNoIndex, $recPaths ),
			$recPaths
		];

		return $pathNoIndex === '' ? $res[0] : $res;
	}

	/**
	 * @param Title $title
	 * @param array $schema
	 * @param array $arr
	 * @param string $path
	 * @return string
	 */
	protected function processSchemaRec( $title, $schema, $arr, $path ) {
		// $isArray = ( $schema['type'] === 'array' );
		$ret = [];
		foreach ( $arr as $key => $value ) {
			$currentPath = $path ? "$path/$key" : $key;

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
				$ret[$key] = $this->processSchemaRec( $title, $subschema, $value, $currentPath );
			} else {
				$ret[$key] = $this->processChild(
					$title,
					$subschema,
					$key,
					$arr,
					$currentPath
				);
			}
		}

		return $this->processParent(
			$title,
			$schema,
			$ret,
			$path
		);
	}

	/**
	 * @param Title $title
	 * @param array $schema
	 * @param array $properties
	 * @param string $path
	 * @param array $recPaths []
	 * @return string
	 */
	public function processParent( $title, $schema, $properties, $path, $recPaths = [] ) {
		$isArray = ( $schema['type'] === 'array' );
		$isRoot = ( $path === '' );

		if ( $isArray ) {
			return implode( !$this->hasTemplate( $path ) ?
				$this->valuesSeparator : '', $properties );
		}

		$properties = array_merge( $properties, $recPaths );
		$ret = '';
		if ( $this->hasTemplate( $path ) ) {
			$ret = $this->processTemplate( $this->templates[$path],
				$this->getTemplateParams( $title, $path, $properties ) );

		} else {
			// *** the cleaning here has no effect
			// for TableResultPrinter since the columns
			// are added to the table from the children
			$properties = array_intersect_key( $properties, array_filter( $this->printouts ) );
			$ret = implode( $this->separator ?? '', $properties );
		}

		if ( $this->isHtml() && $isRoot ) {
			return $this->parser->recursiveTagParseFully( $ret );
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
	 * @param Title $title
	 * @param array|null $schema
	 * @param string $key
	 * @param array $properties
	 * @param string $path
	 * @return string
	 */
	public function processChild( $title, $schema, $key, $properties, $path ) {
		$value = $properties[$key];

		// apply template
		if ( $this->hasTemplate( $path ) ) {
			$value = $this->processTemplate( $this->templates[$path],
				$this->getTemplateParams( $title, $path, $properties ), false );
		}

		$value = (string)$value;

		// disable pagetitle and render in different column
		// ?pagetitle
		// pagetitle=
		if ( empty( $value ) && $key === 'pagetitle' ) {
			$value = $title->getFullText();
		}

		return $value;
	}

}
