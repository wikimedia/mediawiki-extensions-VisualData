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

namespace MediaWiki\Extension\VisualData;

if ( is_readable( __DIR__ . '/../vendor/autoload.php' ) ) {
	include_once __DIR__ . '/../vendor/autoload.php';
}

use MediaWiki\MediaWikiServices;
use Title;

class QueryProcessor {

	/** @var array */
	private $schema = [];

	/** @var array|string|int */
	private $result;

	/** @var array */
	private $resultsList = [];

	/** @var array */
	private $conditionProperties = [];

	/** @var array */
	private $conditionSubjects = [];

	/** @var array */
	private $printouts = [];

	/** @var array */
	private $printoutsOriginal = [];

	/** @var array */
	private $params = [];

	/** @var dbr */
	private $dbr;

	/** @var int */
	private $count;

	/** @var bool */
	private $treeFormat;

	/** @var array */
	private $AndConditions = [];

	/** @var int */
	private $conditionId = null;

	/** @var string */
	private $query;

	/** @var databaseManager */
	private $databaseManager;

	/** @var array */
	private $errors = [];

	/** @var array */
	private $mapKeyToPrintout;

	/** @var array */
	private $formattedNamespaces;

	/** @var bool */
	private $debug;

	/**
	 * @param array $schema
	 * @param string $query
	 * @param array $printouts
	 * @param array $params
	 */
	public function __construct( $schema, $query, $printouts, $params ) {
		$defaultParameters = [
			'schema' => [ '', 'string' ],
			'limit' => [ 100, 'integer' ],
			'offset' => [ 0, 'integer' ],
			'order' => [ '', 'string' ],
			'pagetitle' => [ 'pagetitle', 'string' ],
			'hierarchical-conditions' => [ true, 'bool' ],
			'count-printout' => [ false, 'bool' ],
			'count-printout-min' => [ 1, 'integer' ],
			'debug' => [ false, 'bool' ]
		];
		$params = \VisualData::applyDefaultParams( $defaultParameters, $params );

		$this->debug = $params['debug'];
		$this->databaseManager = new DatabaseManager();
		$this->schema = $schema;
		$this->query = $query;
		$this->printouts = $printouts;
		$this->printoutsOriginal = $this->printouts;
		$this->params = $params;
		$this->dbr = \VisualData::getDB( DB_REPLICA );
		$this->formattedNamespaces = MediaWikiServices::getInstance()
			->getContentLanguage()->getFormattedNamespaces();
	}

	/**
	 * @return int
	 */
	public function getCount() {
		$this->count = true;
		$this->treeFormat = false;
		$this->performQuery();
		if ( !count( $this->errors ) ) {
			return (int)$this->result;
		}
		return -1;
	}

	/**
	 * @return array
	 */
	public function getErrors() {
		return $this->errors;
	}

	/**
	 * @return array
	 */
	public function getValidPrintouts() {
		return $this->printouts;
	}

	/**
	 * @return array
	 */
	public function isPrintCondition() {
		return !empty( $this->conditionId );
	}

	/**
	 * @return int
	 */
	public function getCountTree() {
		$this->count = true;
		$this->treeFormat = true;
		$this->performQuery();
		if ( !count( $this->errors ) ) {
			return (int)$this->result;
		}
		return -1;
	}

	/**
	 * @return array|int
	 */
	public function getResults() {
		$this->count = false;
		$this->treeFormat = false;
		$this->performQuery();
		if ( !count( $this->errors ) ) {
			return $this->result;
		}
		return [];
	}

	/**
	 * @return array
	 */
	public function getResultsTree() {
		$this->count = false;
		$this->treeFormat = true;
		$this->performQuery();
		if ( !count( $this->errors ) ) {
			return $this->result;
		}
		return [];
	}

	/**
	 * @return array
	 */
	public function getQueryData() {
		return [
			'query' => $this->query,
			'printouts' => $this->printouts,
			'params' => $this->params
		];
	}

	private function parseQuery() {
		// pageid
		if ( is_numeric( $this->query ) ) {
			$this->conditionId = (int)trim( $this->query );
			return;
		}

		// e.g. [[new_property::+]][[~*ab*||new_property::~*ab*||new_property_2::~*ab*]]
		preg_replace_callback( '/\[\[(.+?)\]\]/',
			function ( $matches ) {
				$arr = explode( '||', $matches[1] );
				$rel = [];
				$orConditionsSubjects = [];
				$orConditions = [];

				foreach ( $arr as $key => $value ) {
					if ( strpos( $value, '::' ) === false ) {
						// $orConditionsSubjects[] = $value;
						$orConditions['page_title'][] = $value;
						$this->conditionSubjects[] = $value;
					} else {
						[ $prop, $value ] = explode( '::', $value );
						$orConditions[$prop][] = $value;
						$this->conditionProperties[] = $prop;
					}
				}
				if ( count( $orConditions ) ) {
					$this->AndConditions[] = $orConditions;
				}
			}, $this->query );
	}

	/**
	 * @param string $table_id
	 * @return string
	 */
	private function tableNameFromId( $table_id ) {
		switch ( $table_id ) {
			case 1:
				return 'text';
			case 2:
				return 'textarea';
			case 3:
				return 'date';
			case 4:
				return 'datetime';
			case 5:
				return 'time';
			case 6:
				return 'integer';
			case 7:
				return 'numeric';
			case 8:
				return 'boolean';
		}
	}

	/**
	 * @return array
	 */
	private function getOptions() {
		if ( $this->count || $this->params['count-printout'] ) {
			return [];
		}

		$options = [];
		$optionsMap = [
			'order' => 'ORDER BY',
			'limit' => 'LIMIT',
			'offset' => 'OFFSET',
		];

		// $options = ['GROUP BY' => 'page_id'];
		foreach ( $optionsMap as $key => $value ) {
			if ( !empty( $this->params[$key] ) ) {
				$val = $this->params[$key];
				switch ( $key ) {
					case 'order':
						$arr = [];
						$values = preg_split( '/\s*,\s*/', $val, -1, PREG_SPLIT_NO_EMPTY );
						foreach ( $values as $v ) {
							preg_match( '/^\s*(.+?)\s*(ASC|DESC)?\s*$/i', $v, $match_ );
							$propName = $match_[1];
							$sort = $match_[2] ?? 'ASC';
							$index = array_search( $propName, $this->mapKeyToPrintout );

							if ( $index !== false ) {
								$arr[] = "v$index $sort";
							} elseif ( in_array( $propName, ResultPrinter::$titleAliases ) ) {
								$arr[] = "page_title $sort";
							}
						}
						if ( count( $arr ) ) {
							$options[$value] = implode( ', ', $arr );
						}
						break;
					case 'limit':
					case 'offset':
						// *** this shouldn't be anymore necessary
						if ( preg_match( '/^\s*\d+\s*$/', $val ) ) {
							$options[$value] = (int)$this->params[$key];
						}
						break;
				}
			}
		}
		return $options;
	}

	/**
	 * @param string $dataType
	 * @param string|int|float|bool &$val
	 */
	private function castValAndQuote( $dataType, &$val ) {
		switch ( $dataType ) {
			case 'integer':
				$val = filter_var( $val, FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE );
				settype( $val, 'integer' );
				break;
			case 'numeric':
				$val = filter_var( $val, FILTER_VALIDATE_FLOAT, FILTER_NULL_ON_FAILURE );
				settype( $val, 'float' );
				break;
			case 'date':
				$val = date( 'Y-m-d', strtotime( $val ) );
				$val = $this->dbr->addQuotes( $val );
				break;
			case 'datetime':
				$val = date( 'Y-m-d H:i:s', strtotime( $val ) );
				$val = $this->dbr->addQuotes( $val );
				break;
			case 'time':
				$val = date( 'H:i:s', strtotime( $val ) );
				$val = $this->dbr->addQuotes( $val );
				break;
			case 'boolean':
				$val = filter_var( $val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE );
				settype( $val, 'boolean' );
				$val = $val ? 'TRUE' : 'FALSE';
				break;
			case 'text':
			case 'textarea':
			default:
				settype( $val, 'string' );
				$val = $this->dbr->addQuotes( $val );
		}
	}

	/**
	 * @param string $exp
	 * @param string $field
	 * @param string|null $dataType string
	 * @return string
	 */
	private function parseCondition( $exp, $field, $dataType = 'string' ) {
		// use $this->dbr->buildLike( $prefix, $this->dbr->anyString() )
		// if $value contains ~
		$likeBefore = false;
		$likeAfter = false;
		$value = $exp;
		preg_match( '/^(!)?(~)?(.+?)(~)?$/', $exp, $match );

		if ( !empty( $match ) ) {
			$value = $match[3];
			if ( !empty( $match[2] ) ) {
				$likeBefore = true;
			}
			if ( !empty( $match[4] ) ) {
				$likeAfter = true;
			}
		}

		if ( !$likeBefore && !$likeAfter ) {
			if ( $value === '+' ) {
				return "$field IS NOT NULL";
			}
			$quotedVal = $value;
			$this->castValAndQuote( $dataType, $quotedVal );

			if ( in_array( $dataType, [ 'integer', 'numeric', 'date', 'datetime', 'time' ] ) ) {
				// https://www.semantic-mediawiki.org/wiki/Help:Search_operators#User_manual

				$patterns = [
					// '/^(>>)\s*(.+)$/' => '>',
					'/^(>)\s*(.+)$/' => '>',
					'/^(>=)\s*(.+)$/' => '>=',
					'/^(<)\s*(.+)$/' => '<',
					// '/^(<<)\s*(.+)$/' => '<',
					'/^(<=)\s*(.+)$/' => '<=',
					'/^(!)\s*(.+)$/' => '!=',
				];
			} else {
				$patterns = [
					'/^(!)\s*(.+)$/' => '!=',
				];
			}
			foreach ( $patterns as $regex => $sql ) {
				preg_match( $regex, $exp, $match_ );

				if ( !empty( $match_ ) ) {
					return "$field {$sql} " . $this->dbr->addQuotes( $match_[2] );
				}
			}
			return "$field = $quotedVal";
		}

		$any = $this->dbr->anyString();
		if ( $likeBefore && !$likeAfter ) {
			$quotedVal = $this->dbr->buildLike( $any, $value );
		} elseif ( !$likeBefore && $likeAfter ) {
			$quotedVal = $this->dbr->buildLike( $value, $any );
		} elseif ( $likeBefore && $likeAfter ) {
			$quotedVal = $this->dbr->buildLike( $any, $value, $any );
		}
		$not = ( empty( $match[1] ) ) ? '' : ' NOT';

		return "{$field}{$not}{$quotedVal}";
	}

	/**
	 * @param string $value
	 * @param array &$orConds
	 * @param array &$tables
	 * @param array &$joins
	 * @param array &$categories
	 */
	private function processTitle( $value, &$orConds, &$tables, &$joins, &$categories ) {
		$title = Title::newFromText( $value );
		// load article id, but consider also unexisting
		$isKnown = $title->isKnown();
		if ( $title ) {
			if ( $title->getNamespace() !== NS_CATEGORY ) {
				$orConds[] = 't0.page_id = ' . $title->getArticleID();

			} else {
				$categories[] = $title;
			}

		} else {
			// we got something in this form A:A/~
			$tables['page_alias'] = 'page';
			// 'USE INDEX' => ( version_compare( MW_VERSION, '1.36', '<' ) ? 'name_title' : 'page_name_title' ),
			$joins['page_alias'] = [ 'JOIN', [ 'page_alias.page_id = t0.page_id' ] ];
			// @FIXME replace underscore inside parseCondition
			$value = str_replace( ' ', '_', $value );

			// @TODO ...
			// check if is a registered namespace
			$arr = explode( ':', $value );
			if ( count( $arr ) > 1 ) {
				$ns = array_shift( $arr );
				// phpcs:ignore Generic.CodeAnalysis.AssignmentInCondition.Found
				if ( ( $nsIndex = array_search( $ns, $this->formattedNamespaces ) ) !== false ) {
					$value = implode( ':', $arr );
					$orConds_[] = "page_alias.page_namespace = $nsIndex";
				}
			}
			$orConds[] = $this->parseCondition( $value, 'page_title' );
		}
	}

	/**
	 * @param array $mapConds
	 * @param array &$conds
	 * @param array &$tables
	 * @param array &$joins
	 */
	private function getConditions( $mapConds, &$conds, &$tables, &$joins ) {
		foreach ( $this->AndConditions as $i => $value ) {
			$orConds = [];
			$categories = [];
			foreach ( $value as $printout => $values ) {
				if ( !array_key_exists( $printout, $mapConds ) && $printout === 'page_title' ) {
					foreach ( $values as $v ) {
						$this->processTitle( $v, $orConds, $tables, $joins, $categories );
					}

				} elseif ( array_key_exists( $printout, $mapConds ) ) {
					$field = "t{$mapConds[$printout]['key']}.value";
					$tablename = $mapConds[$printout]['tablename'];

					// OR conditions same property e.g. [[prop a::a||b]]
					foreach ( $values as $v ) {
						$orConds[] = $this->parseCondition( $v, $field, $tablename );
					}
				}
			}
			if ( count( $categories ) ) {
				$categoryConds = [];
				foreach ( $categories as $title_ ) {
					$categoryConds[] = "categorylinks_$i.cl_to = " . $this->dbr->addQuotes( $title_->getDbKey() )
						. " AND categorylinks_$i.cl_from = t0.page_id";
				}
				$tables["categorylinks_$i"] = 'categorylinks';
				$joins["categorylinks_$i"] = [ 'JOIN', $this->dbr->makeList( $categoryConds, LIST_OR ) ];
			}
			if ( count( $orConds ) ) {
				$conds[] = $this->dbr->makeList( $orConds, LIST_OR );
			}
		}
	}

	private function performQuery() {
		$this->parseQuery();

		if ( !$this->conditionId && empty( $this->AndConditions ) ) {
			$this->errors[] = 'no query';
			return;
		}

		$schemaId = $this->databaseManager->getSchemaId( $this->params['schema'] );

		if ( $schemaId === null ) {
			$this->errors[] = 'no schema (' . $this->params['schema'] . ')';
			return;
		}

		$conds = [
			'schema_id' => $schemaId,
		];

		$res = $this->dbr->select(
			'visualdata_prop_tables',
			[ 'table_id', 'path_no_index' ],
			$conds,
			__METHOD__
		);

		if ( !$res->numRows() ) {
			$this->errors[] = 'no matched schema';
			return;
		}

		$mapPathNoIndexTable = [];
		foreach ( $res as $row ) {
			$row = (array)$row;
			$tablename = $this->tableNameFromId( $row['table_id'] );
			$mapPathNoIndexTable[$row['path_no_index']] = $tablename;
		}

		// remove non existing printouts, allow retrieving all
		// printouts of subitems, e.g. authors/first_name, authors/last_name
		// from |?authors, taking into account escaping of json pointers
		foreach ( $this->printouts as $key => $value ) {
			// $value = $this->databaseManager->escapeJsonPtr( $value );
			$pattern = str_replace( '~', '~0', $value );
			$pattern = str_replace( '/', '(?:~1|\\/)', $pattern );

			if ( !array_key_exists( $value, $mapPathNoIndexTable ) ) {
				unset( $this->printouts[$key] );
				foreach ( $mapPathNoIndexTable as $k => $v ) {
					if ( preg_match( "/^$pattern$/", $k )
						|| preg_match( "/^$pattern\//", $k )
					) {
						$this->printouts[] = $k;
					}
				}
			} else {
				$this->printouts[$key] = $value;
			}
		}

		// retrieve all, but order according to the schema
		// descriptor
		if ( empty( $this->printouts ) ) {
			$this->printouts = array_keys( $mapPathNoIndexTable );

			$schemaStr = json_encode( $this->schema );
			usort( $this->printouts, static function ( $a, $b ) use ( $schemaStr ) {
				// $aPos = strpos( $schemaStr, "\"name\":\"$a\"" );
				// $bPos = strpos( $schemaStr, "\"name\":\"$b\"" );
				// if ( $aPos === false ) {
				// 	$aPos = INF;
				// }
				// if ( $bPos === false ) {
				// 	$bPos =INF;
				// }

				$a = preg_quote( $a, '/' );
				$b = preg_quote( $b, '/' );

				preg_match( "/\"name\"\s*:\s*\"$a\"/", $schemaStr, $matches, PREG_OFFSET_CAPTURE );
				$aPos = ( !empty( $matches[0][1] ) ? $matches[0][1] : INF );

				preg_match( "/\"name\"\s*:\s*\"$b\"/", $schemaStr, $matches, PREG_OFFSET_CAPTURE );
				$bPos = ( !empty( $matches[0][1] ) ? $matches[0][1] : INF );

				if ( $aPos === $bPos ) {
					return 0;
				}
				return ( $aPos < $bPos ) ? -1 : 1;
			} );
		}

		$arr = [];
		foreach ( $this->conditionProperties as $pathNoIndex ) {
			$arr[$pathNoIndex] = 0;
		}

		foreach ( $this->printouts as $pathNoIndex ) {
			$arr[$pathNoIndex] = 1;
		}

		uksort( $arr, static function ( $ka, $kb ) {
			$a = substr_count( $ka, '/' );
			$b = substr_count( $kb, '/' );
			return ( $a == $b ? 0 : (int)( $a > $b ) );
		} );

		$this->conditionProperties = array_intersect( $this->conditionProperties, array_keys( $mapPathNoIndexTable ) );

		if ( !$this->conditionId && !count( $this->conditionProperties ) && !count( $this->conditionSubjects ) ) {
			$this->errors[] = 'no valid conditions';
			return;
		}

		$arr = [];
		foreach ( $this->conditionProperties as $pathNoIndex ) {
			$arr[$pathNoIndex] = false;
		}

		foreach ( $this->printouts as $pathNoIndex ) {
			if ( array_key_exists( $pathNoIndex, $mapPathNoIndexTable ) ) {
				$arr[$pathNoIndex] = true;
			}
		}

		$combined = [];
		foreach ( $arr as $pathNoIndex => $isPrintout ) {
			$printoutParent = substr( $pathNoIndex, 0, strrpos( $pathNoIndex, '/' ) );

			$combined[] = [
				'printout' => $pathNoIndex,
				'printoutParent' => $printoutParent,
				'depth' => substr_count( $pathNoIndex, '/' ),
				'isPrintout' => $isPrintout
			];
		}

		usort( $combined, static function ( $a, $b ) {
			return ( $a['depth'] == $b['depth'] ? 0
				: (int)( $a['depth'] > $b['depth'] ) );
		} );

		foreach ( $combined as $i => $v ) {
			for ( $ii = 0; $ii < $i; $ii++ ) {
				if ( !empty( $combined[$ii]['printoutParent'] )
					&& strpos( $v['printoutParent'], $combined[$ii]['printoutParent'] ) === 0 ) {
					$combined[$i]['parent'] = $ii;
					$combined[$i]['isSibling'] = $v['depth'] === $combined[$ii]['depth'];
				}
			}
		}

		$fields = [];
		$tables = [];
		$conds = [];
		$options = [];
		$joins = [];

		$fields['page_id'] = 't0.page_id';
		$conds['t0.schema_id'] = $schemaId;

		if ( $this->conditionId ) {
			$conds[] = 't0.page_id = ' . $this->conditionId;
		}

		$mapConds = [];
		foreach ( $combined as $key => $v ) {
			$pathNoIndex = $v['printout'];
			$isPrintout = $v['isPrintout'];
			if ( $isPrintout ) {
				$this->mapKeyToPrintout[$key] = $v['printout'];
			}
			$tablename = $mapPathNoIndexTable[$pathNoIndex];
			$mapConds[$pathNoIndex] = [ 'key' => $key, 'tablename' => $tablename ];
			$joinConds = [];

			// @ATTENTION !!
			// the following query structure assumes that
			// the first queried printout always exists,
			// evaluate whether to use something like
			// "SELECT 1 FROM DUAL" instead

			if ( $key === 0 ) {
				$conds["t$key.path_no_index"] = $pathNoIndex;
			} else {
				$joinConds["t$key.path_no_index"] = $pathNoIndex;
			}

			if ( $key > 0 ) {
				$joinConds[] = "t$key.schema_id=t0.schema_id";
				$joinConds[] = "t$key.page_id=t0.page_id";
				if ( $this->params['hierarchical-conditions']
					&& array_key_exists( 'parent', $v ) ) {
					$parentKey = $v['parent'];
					if ( !$v['isSibling'] ) {
						$joinConds[] = "LOCATE( t$parentKey.path_parent, t$key.path_parent ) = 1";

					// @IMPORTANT!! otherwise, with locate between
					// identical strings, the query will not work!!
					// (it could be related to how mysql manages indexes)
					} else {
						$joinConds[] = "t$parentKey.path_parent = t$key.path_parent";
					}
				}
				$joins["t$key"] = [ 'LEFT JOIN', $this->dbr->makeList( $joinConds, LIST_AND ) ];
			}

			$tables_ = [
				't' => "visualdata_$tablename",
				'p' => 'visualdata_props'
			];
			$fields_ = [ 't.value', 't.page_id', 'p.path_no_index', 'p.path', 'p.path_parent', 'p.schema_id' ];
			$conds_ = [];
			$options_ = [];
			$jconds_ = [
				'p' => [ 'JOIN', 'p.id=t.prop_id' ]
			];

			// @see ActiveUsersPager
			$tables["t$key"] = $this->dbr->buildSelectSubquery(
				$tables_,
				$fields_,
				$conds_,
				__METHOD__,
				$options_,
				$jconds_
			);

			if ( $isPrintout ) {
				if ( !$this->treeFormat ) {
					$fields["v$key"] = "t$key.value";
				} else {
					$fields["v$key"] = "GROUP_CONCAT(t$key.value SEPARATOR 0x1E)";
					$fields["p$key"] = "GROUP_CONCAT(t$key.path SEPARATOR 0x1E)";
				}
			}
		}

		$this->getConditions( $mapConds, $conds, $tables, $joins );

		$method = ( !$this->debug ? ( !$this->count ? 'select' : 'selectField' )
			: 'selectSQLText' );

		$options = $this->getOptions();

		// join page table also when sorting by mainlabel
		if ( !empty( $options['ORDER BY'] )
			&& strpos( $options['ORDER BY'], 'page_title' ) !== false
		) {
			$tables['page_alias'] = 'page';
			$joins['page_alias'] = [ 'JOIN', [ 'page_alias.page_id = t0.page_id' ] ];
		}

		if ( $this->treeFormat ) {
			$options['GROUP BY'] = 'page_id';
		}

		// used by datatables searchPanes
		if ( $this->params['count-printout'] ) {
			$fields['count'] = 'COUNT(*)';

			foreach ( $combined as $k => $v ) {
				if ( $v['isPrintout'] ) {
					$groupPrintout = "v$k";
					$options['GROUP BY'] = $groupPrintout;
					break;
				}
			}

			if ( $this->params['count-printout-min'] > 1 ) {
				$options['HAVING'] = 'count >= ' . $this->params['count-printout-min'];
			}
		}

		$res = $this->dbr->$method(
			// tables
			$tables,
			// fields
			!$this->count ? $fields : 'COUNT(*) as count',
			// where
			$conds,
			__METHOD__,
			// options
			$options,
			// join
			$joins
		);

		if ( $this->debug ) {
			$this->result = (string)$res;
			return;
		}

		// used by datatables searchPanes
		if ( $this->params['count-printout'] ) {
			$ret = [];
			foreach ( $res as $row ) {
				$row = (array)$row;
				$ret[$row[$groupPrintout]] = (int)$row['count'];
			}
			$this->result = $ret;
			return;
		}

		if ( $this->count ) {
			$this->result = (int)$res;
			return;
		}

		$this->result = [];

		if ( !$res->numRows() ) {
			return;
		}

		$separator = chr( hexdec( '0x1E' ) );
		$titles = [];
		foreach ( $res as $row ) {
			$row = (array)$row;
			$row_ = [];
			$pageId = $row['page_id'];
			unset( $row['page_id'] );

			if ( !array_key_exists( $pageId, $titles ) ) {
				$title_ = Title::newFromID( $pageId );
				$titles[$pageId] = $title_;
			}

			if ( !$this->treeFormat ) {
				// important, this ensures rows have same
				// number of fields
				$row_ = array_fill_keys( $this->printoutsOriginal, '' );

				$fields = [];
				foreach ( $row as $k => $v ) {
					if ( empty( $v ) ) {
						continue;
					}

					$index = substr( $k, 1 );
					$row_[$this->mapKeyToPrintout[$index]] = $v;
				}
			} else {
				foreach ( $this->mapKeyToPrintout as $key => $printout ) {
					if ( empty( $row["p$key"] ) ) {
						continue;
					}
					$paths = explode( $separator, $row["p$key"] );
					$values = explode( $separator, (string)$row["v$key"] );
					foreach ( $paths as $key => $path ) {
						$row_[$path] = $values[$key];
					}
				}
			}

			$this->result[] = [
				$titles[$pageId],
				\VisualData::plainToNested( $row_, true )
			];
		}

		// if ( $this->conditionId && count( $this->result ) ) {
		// 	$this->result = $this->result[0];
		// }
	}

}
