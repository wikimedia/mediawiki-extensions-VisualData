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

if ( is_readable( __DIR__ . '/../../vendor/autoload.php' ) ) {
	include_once __DIR__ . '/../../vendor/autoload.php';
}

use Swaggest\JsonDiff\JsonDiff;
use Swaggest\JsonDiff\JsonPointer;
use Title;

class DatabaseManager {

	/** @var dbr */
	public $dbr;

	/** @var dbw */
	public $dbw;

	/** @var int */
	public $articleId;

	/** @var dateTime */
	public $dateTime;

	/** @var array */
	private $mapSchemaPathPropId = [];

	/** @var array */
	private $errors = [];

	/** @var array */
	public static $propTypes = [
		'text',
		'textarea',
		'date',
		'datetime',
		'time',
		'integer',
		'numeric',
		'boolean'
	];

	/** @var array */
	public static $tables = [
		'visualdata_schema_pages',
		'visualdata_schemas',
		'visualdata_props',
		// 'visualdata_printouts',
		'visualdata_prop_tables',
		'visualdata_links',
		'visualdata_links_template',
		'visualdata_text',
		'visualdata_textarea',
		'visualdata_date',
		'visualdata_datetime',
		'visualdata_time',
		'visualdata_integer',
		'visualdata_numeric',
		'visualdata_boolean'
	];

	public function __construct() {
		$this->dbr = \VisualData::getDB( DB_REPLICA );
		$this->dbw = \VisualData::getDB( DB_PRIMARY );
		$this->dateTime = date( 'Y-m-d H:i:s' );
	}

	/**
	 * @param array $schema
	 * @param array $data
	 * @return array
	 */
	public function prepareData( $schema, $data ) {
		$ret = [];
		$path = self::escapeJsonPointerPart( $schema['wiki']['name'] );
		$pathNoIndex = '';
		$this->flattenData( $ret, $schema, $data, $path, $pathNoIndex );
		return $ret;
	}

	/**
	 * @param Title $title
	 */
	public function invalidateTransclusionTargets( $title ) {
		$transclusionTargets = \VisualData::getTransclusionTargets( $title );

		foreach ( $transclusionTargets as $title_ ) {
			// $title_->invalidateCache();
			$wikiPage_ = \VisualData::getWikiPage( $title_ );
			if ( $wikiPage_ ) {
				$wikiPage_->doPurge();
			}
		}
	}

	/**
	 * @param Title $title
	 * @return bool
	 */
	public function handleTemplateLinks( $title ) {
		$tableName = 'visualdata_links_template';
		$conds = [
			'page_id' => $title->getArticleID(),
		];
		$res = $this->dbr->select(
			$tableName,
			[ 'parent_page_id' ],
			$conds,
			__METHOD__,
			[]
		);

		foreach ( $res as $row ) {
			$title_ = Title::newFromID( $row->parent_page_id );
			if ( $title_ && $title_->isKnown() ) {
				$wikiPage_ = \VisualData::getWikiPage( $title_ );
				if ( $wikiPage_ ) {
					$wikiPage_->doPurge();
				}
				$this->invalidateTransclusionTargets( $title_ );
			}
		}
	}

	/**
	 * @param Title $title
	 * @param string $schema
	 * @param array $templates
	 * @return bool
	 */
	public function storeLinkTemplates( $title, $schema, $templates ) {
		if ( !\VisualData::isKnownArticle( $title ) ) {
			return false;
		}

		$schemaId = $this->recordSchema( $schema );

		$tableName = 'visualdata_links_template';
		$conds = [
			'parent_page_id' => $title->getArticleID(),
			'schema_id' => $schemaId,
			'updated_at' => $this->dateTime,
			'created_at' => $this->dateTime
		];

		foreach ( $templates as $titleStr ) {
			$title_ = \Title::makeTitle( NS_TEMPLATE,
				\Title::capitalize( $titleStr, NS_TEMPLATE ) );

			if ( !$title_ || !$title_->isKnown() ) {
				continue;
			}

			$conds_ = array_merge( $conds, [
				'page_id' => $title_->getArticleID(),
			] );

			$res = $this->dbw->insert(
				$tableName,
				$conds_
			);
		}
	}

	/**
	 * @param Title $title
	 * @param string $type
	 * @param string|array $schema
	 * @return bool
	 */
	public function storeLink( $title, $type, $schema ) {
		if ( !\VisualData::isKnownArticle( $title ) ) {
			return false;
		}

		$schemas = ( !is_array( $schema ) ? [ $schema ] : $schema );

		$tableName = 'visualdata_links';
		$conds = [
			'page_id' => $title->getID(),
			'type' => $type
		];

		foreach ( $schemas as $schemaName ) {
			$schemaId = $this->recordSchema( $schemaName );

			if ( (bool)$this->dbr->selectField(
				$tableName,
				'count(*) as count',
				array_merge( $conds, [
					'schema_id' => $schemaId
				] ),
				__METHOD__,
				[
					'LIMIT' => 1
				]
			) ) {
				continue;
			}

			$conds_ = array_merge( $conds, [
				'schema_id' => $schemaId,
				'updated_at' => $this->dateTime,
				'created_at' => $this->dateTime
			] );

			$res = $this->dbw->insert(
				$tableName,
				$conds_
			);
		}
		return true;
	}

	/**
	 * @param string $schema
	 * @return bool
	 */
	public function schemaExists( $schema ) {
		$conds = [
			'page_namespace' => NS_VISUALDATASCHEMA,
			'page_is_redirect' => 0,
			'page_title' => str_replace( ' ', '_', $schema )
		];

		return (bool)$this->dbr->selectField(
			'page',
			'count(*) as count',
			$conds,
			__METHOD__,
			[
				'LIMIT' => 1,
				'USE INDEX' => ( version_compare( MW_VERSION, '1.36', '<' ) ? 'name_title' : 'page_name_title' ),
			]
		);

		// $tableName = 'visualdata_schemas';
		// return (bool)$this->dbr->selectField(
		// 	$tableName,
		// 	'count(*) as count',
		// 	[ 'schemaname' => $schema ],
		// 	__METHOD__,
		// 	[ 'LIMIT' => 1 ]
		// );
	}

	/**
	 * @param string $schemaname
	 * @return int|null
	 */
	public function getSchemaId( $schemaname ) {
		$ret = $this->dbr->selectField(
			'visualdata_schemas',
			'id',
			[ 'name' => $schemaname ],
			__METHOD__,
			[ 'LIMIT' => 1 ],
		);

		if ( !$ret ) {
			return null;
		}
		return $ret;
	}

	/**
	 * @param int $schema_id
	 * @return string|null
	 */
	public function getSchemaName( $schema_id ) {
		$ret = $this->dbr->selectField(
			'visualdata_schemas',
			'name',
			[ 'id' => $schema_id ],
			__METHOD__,
			[ 'LIMIT' => 1 ],
		);

		if ( !$ret ) {
			return null;
		}
		return $ret;
	}

	/**
	 * @param Title $title
	 */
	public function removeLinks( $title ) {
		if ( !$title ) {
			return;
		}
		$articleId = $title->getID();
		if ( !$articleId ) {
			return;
		}

		// this prevents possible errors from maintenance/update
		// if an extension will call the hook that calls this
		// method before that extension's tables are created
		if ( !$this->dbr->tableExists( 'visualdata_links' ) ) {
			return;
		}

		$tableName = 'visualdata_links';
		$conds = [ 'page_id' => $articleId ];
		$this->dbw->delete(
			$tableName,
			$conds,
			__METHOD__
		);

		$tableName = 'visualdata_links_template';
		$conds = [ 'parent_page_id' => $articleId ];
		$this->dbw->delete(
			$tableName,
			$conds,
			__METHOD__
		);
	}

	/**
	 * @param array $schemas
	 */
	public function invalidatePagesWithQueries( $schemas = [] ) {
		$tableName = 'visualdata_links';

		foreach ( $schemas as $v ) {
			if ( !isset( $v['id'] ) ) {
				$schemaId = $this->getSchemaId( $v['name'] );
				if ( !$schemaId ) {
					continue;
				}
			} else {
				$schemaId = $v['id'];
			}

			$res = $this->dbr->select(
				$tableName,
				[ 'page_id' ],
				[ 'type' => 'query', 'schema_id' => $schemaId ],
				__METHOD__,
				[]
			);

			foreach ( $res as $row ) {
				$title_ = Title::newFromID( $row->page_id );
				if ( $title_ && $title_->isKnown() ) {
					$wikiPage_ = \VisualData::getWikiPage( $title_ );
					if ( $wikiPage_ ) {
						$wikiPage_->doPurge();
					}

					// *** this is not necessary, since visualdata_links
					// already contain transclusion targets
					// $this->invalidateTransclusionTargets( $title_ );
				}
			}
		}
	}

	/**
	 * @param User $user
	 * @param string $schemaName
	 * @param bool $evaluate
	 * @return int
	 */
	public function deleteSchema( $user, $schemaName, $evaluate ) {
		$pages = $this->pagesWithSchema( $schemaName );

		if ( $evaluate ) {
			return count( $pages );
		}

		$conds = [
			'page_id' => $articleId
		];

		$jobs = [];
		foreach ( $pages as $title_ ) {
			$jobs[] = new UpdateDataJob( $title_,
				[
					'user_id' => $user->getId(),
					'action' => 'delete-schema',
					'schema' => $schemaName,
				]
			);
		}

		\VisualData::pushJobs( $jobs );
	}

	/**
	 * @param User $user
	 * @param string $previousLabel
	 * @param string $label
	 * @param bool $evaluate
	 * @return int
	 */
	public function renameSchema( $user, $previousLabel, $label, $evaluate ) {
		$pages = $this->pagesWithSchema( $previousLabel );
		if ( $evaluate ) {
			return count( $pages );
		}

		// rename schema
		$tableName = 'visualdata_schemas';
		$conds_ = [
			'name' => $previousLabel
		];
		$update = [
			'name' => $label
		];
		$res = $this->dbw->update(
			$tableName,
			$update,
			$conds_,
			__METHOD__
		);

		// *** because this also involves renaming of schema names
		// in parser functions, the best way is to create a
		// form/query builder, and to place in wiki articles using an id,
		// then replacing the schema of the query as json

		$jobs = [];
		foreach ( $pages as $title_ ) {
			$jobs[] = new UpdateDataJob( $title_,
				[
					'user_id' => $user->getId(),
					'action' => 'rename-schema',
					'previous-label' => $previousLabel,
					'new-label' => $label,
				]
			);
		}

		\VisualData::pushJobs( $jobs );
	}

	/**
	 * @param User $user
	 * @param string $schemaName
	 * @param array $storedSchema
	 * @param array $updatedSchema
	 * @param bool $evaluate
	 * @return int
	 */
	public function diffSchema( $user, $schemaName, $storedSchema, $updatedSchema, $evaluate ) {
		if ( !class_exists( 'Swaggest\JsonDiff\JsonDiff' ) ) {
			return;
		}
		$schemaId = $this->getSchemaId( $schemaName );
		if ( !$schemaId ) {
			// no stored properties related to this schema
			return;
		}

		// instead than (object)$storedSchema
		$storedSchemaObj = json_decode( json_encode( $storedSchema ) );
		$updatedSchemaObj = json_decode( json_encode( $updatedSchema ) );

		$diff = new JsonDiff(
			$storedSchemaObj,
			$updatedSchemaObj,
			JsonDiff::REARRANGE_ARRAYS
		);

		$patch = $diff->getPatch();
		// @see https://github.com/swaggest/json-diff?tab=readme-ov-file#jsonpatch
		$patches = $patch->jsonSerialize();

		$getRelatedSchema = static function ( $obj, $path ) {
			return json_decode( json_encode( JsonPointer::getByPointer( $obj, $path ) ), true );
		};

		$added = [];
		$removed = [];
		foreach ( $patches as $patch ) {
			$patch = json_decode( json_encode( $patch ), true );

			switch ( $patch['op'] ) {
				// *** attention, this is considered removed
				// only if it hasn't been renamed (by comparing
				// the uuid)
				case 'remove':
					$schema_ = $getRelatedSchema( $storedSchemaObj, $patch['path'] );
					if ( is_array( $schema_ ) && $schema_['wiki']['type'] !== 'content-block' ) {
						$removed[] = $patch['path'];
					}
					break;
				case 'add':
					$schema_ = $getRelatedSchema( $updatedSchemaObj, $patch['path'] );
					if ( is_array( $schema_ ) && $schema_['wiki']['type'] !== 'content-block' ) {
						$added[] = $patch['path'];
					}
					break;
				// @TODO
				case 'replace':
					break;
				// @TODO
				case 'move':
					break;
				// @TODO
				case 'copy':
					break;
			}
		}

		$renamed = [];
		foreach ( $added as $key => $newPath ) {
			$objA = $getRelatedSchema( $updatedSchemaObj, $newPath );

			// @FIXME with arrays the uuid is being mistakenly
			// copied to the child, not the parent schema
			if ( isset( $objA['wiki']['uuid'] ) ) {
				foreach ( $removed as $k => $oldPath ) {
					$objB = $getRelatedSchema( $storedSchemaObj, $oldPath );
					if ( isset( $objB['wiki']['uuid'] )
						&& $objB['wiki']['uuid'] === $objA['wiki']['uuid']
					) {
						$renamed[$oldPath] = $newPath;
						unset( $added[$key] );
						unset( $removed[$k] );
					}
				}
			}
		}

		if ( !count( $renamed ) && !count( $removed ) ) {
			return;
		}

		$pages = $this->pagesWithSchema( $schemaName );

		if ( $evaluate ) {
			return count( $pages );
		}

		// remove from visualdata_props and visualdata_prop_tables
		$tableNameProps = $this->dbr->tableName( 'visualdata_props' );
		$tableNamePropTables = $this->dbr->tableName( 'visualdata_prop_tables' );

		foreach ( $removed as $path ) {
			$printout_ = $this->getPrintoutOfPath( $storedSchema, $path );
			if ( $printout_ ) {
				$conds = [
					'schema_id' => $schemaId,
					'path_no_index' => $printout_
				];

				$this->dbw->delete(
					$tableNameProps,
					$conds,
					__METHOD__
				);

				$this->dbw->delete(
					$tableNamePropTables,
					$conds,
					__METHOD__
				);
			}
		}

		// *** rename of db entries is performed
		// by rebuildArticleDataFromSlot from the job itself
		// that also calls removeUnusedEntries

		// *** as above, if a property name is
		// changed, this may require the rename of
		// property names in parser functions,
		// therefore the best way is to use
		// a query builder, to save data as json
		// and to replace properties in the json
		// object

		$jobs = [];
		foreach ( $pages as $title_ ) {
			$jobs[] = new UpdateDataJob( $title_,
				[
					'user_id' => $user->getId(),
					'action' => 'edit-schema',
					'schema' => $schemaName,
					'renamed' => $renamed,
					'removed' => $removed,
					'added' => $added,
				]
			);
		}

		\VisualData::pushJobs( $jobs );
	}

	/**
	 * @param string $schemaName
	 * @return array
	 */
	public function pagesWithSchema( $schemaName ) {
		$schemaId = $this->getSchemaId( $schemaName );
		if ( !$schemaId ) {
			// no stored properties related to this schema
			return [];
		}

		$dbr = $this->dbr;

		// @see MediaWiki\Extension\VisualData\Pagers/DataPager
		$join_conds = [];
		$join_conds['page_alias'] = [ 'LEFT JOIN', 'schema_pages.page_id=page_alias.page_id' ];
		$options = [];
		$tables = [];
		$tables['page_alias'] = 'page';
		$tables['schema_pages'] = 'visualdata_schema_pages';
		$fields = [ 'page_title', 'page_alias.page_id' ];
		$conds[] = 'schema_pages.page_id != 0';
		$conds[ 'schema_id' ] = $schemaId;

		$res = $this->dbr->select(
			$tables,
			// fields
			$fields,
			// where
			$conds,
			__METHOD__,
			$options,
			// join conds
			$join_conds
		);

		$ret = [];
		foreach ( $res as $row ) {
			$title_ = Title::newFromID( $row->page_id );
			if ( $title_ && $title_->isKnown() ) {
				$ret[] = $title_;
			}
		}

		return $ret;
	}

	/**
	 * @param Title $title
	 */
	public function deletePage( $title ) {
		$articleId = $title->getID();

		// check if the current page contains any query
		$tableName = 'visualdata_links';
		$res = $this->dbr->select(
			$tableName,
			[ 'page_id' ],
			[ 'type' => 'query', 'page_id' => $articleId ],
			__METHOD__,
			[]
		);

		// invalidate transclusion targets
		if ( $res->count() ) {
			$this->invalidateTransclusionTargets( $title );
		}

		// check if the deleted page contains data
		// related to one or more schemas
		$tableName = 'visualdata_schema_pages';
		$conds = [
			'page_id' => $articleId
		];

		$res = $this->dbr->select(
			$tableName,
			// fields
			[ 'schema_id' ],
			// where
			$conds,
			__METHOD__,
			[]
		);

		$schemas = [];
		foreach ( $res as $row ) {
			$schemas[] = [ 'id' => $row->schema_id ];
		}

		$res = $this->dbw->delete(
			$tableName,
			$conds,
			__METHOD__,
			[]
		);

		// delete properties related to the deleted article
		foreach ( self::$propTypes as $propType ) {
			$tableName = "visualdata_$propType";

			$res = $this->dbw->delete(
				$tableName,
				$conds,
				__METHOD__,
				[]
			);
		}

		$conds = [
			'page_id' => $articleId
		];
		$tableName = 'visualdata_links';
		$this->dbw->delete(
			$tableName,
			$conds,
			__METHOD__
		);

		$conds = [
			'parent_page_id' => $articleId
		];
		$tableName = 'visualdata_links_template';
		$this->dbw->delete(
			$tableName,
			$conds,
			__METHOD__
		);

		// remove unused entries
		$this->removeUnusedEntries();

		// @TODO delete schema if VisualDataSchema namespace

		// invalidate cache of pages with queries
		// involving delete schemas
		$this->invalidatePagesWithQueries( $schemas );
	}

	public function removeUnusedEntries() {
		// remove unused entries from visualdata_props
		$tableNameProps = $this->dbr->tableName( 'visualdata_props' );
		foreach ( self::$propTypes as $propType ) {
			$tableName = $this->dbr->tableName( "visualdata_$propType" );
			$tableId = $this->tableTypeToId( $propType );
			$sql = "DELETE FROM $tableNameProps WHERE table_id = $tableId AND id NOT IN (SELECT prop_id FROM $tableName)";
			$res = $this->dbw->query( $sql, __METHOD__ );
		}
	}

	/**
	 * @param Title $title
	 * @param array $deletedSchemas
	 * @param array &$errors
	 */
	public function deleteArticleSchemas( $title, $deletedSchemas, &$errors ) {
		$articleId = $title->getArticleID();

		$schemas = [];
		foreach ( $deletedSchemas as $schemaName ) {
			$tableName = 'visualdata_schemas';
			$conds_ = [
				'name' => $schemaName
			];
			$schemaId = $this->dbr->selectField(
				$tableName,
				'id',
				$conds_,
				__METHOD__,
				[ 'ORDER BY' => 'id DESC' ]
			);

			if ( !$schemaId ) {
				continue;
			}

			$tableName = 'visualdata_schema_pages';
			$conds_ = [
				'schema_id' => $schemaId,
				'page_id' => $articleId
			];
			$this->dbw->delete(
				$tableName,
				$conds_,
				__METHOD__
			);

			$schemas[] = [ 'id' => $schemaId ];
		}

		// before deleting links
		$this->invalidatePagesWithQueries( $schemas );

		foreach ( $schemas as $value ) {
			$schemaId = $value['id'];

			foreach ( self::$propTypes as $propType ) {
				$tableName = "visualdata_$propType";

				$this->dbw->deleteJoin(
					// delTable
					$tableName,
					// joinTable
					'visualdata_props',
					// delVar
					'prop_id',
					// joinVar
					$this->dbr->tableName( 'visualdata_props' ) . '.id',
					// conds
					[ 'page_id' => $articleId, 'schema_id' => $schemaId ],
					__METHOD__
				);
			}

			$conds = [
				'page_id' => $articleId,
				'schema_id' => $schemaId
			];
			$tableName = 'visualdata_links';
			$this->dbw->delete(
				$tableName,
				$conds,
				__METHOD__
			);
			$conds = [
				'parent_page_id' => $articleId,
				'schema_id' => $schemaId
			];
			$tableName = 'visualdata_links_template';
			$this->dbw->delete(
				$tableName,
				$conds,
				__METHOD__
			);
		}

		$this->removeUnusedEntries();
	}

	/**
	 * @param string $schemaName
	 * @return int
	 */
	private function recordSchema( $schemaName ) {
		$tableName = 'visualdata_schemas';
		$conds = [
			'name' => $schemaName,
		];
		$insert = array_merge( $conds, [
			'updated_at' => $this->dateTime,
			'created_at' => $this->dateTime
		] );
		$schemaId = $this->updateOrInsert( $tableName, $conds, $insert );

		return $schemaId;
	}

	/**
	 * @param string $schemaName
	 * @param int $articleId
	 * @return int
	 */
	private function recordSchemaPage( $schemaName, $articleId ) {
		$schemaId = $this->recordSchema( $schemaName );

		$tableName = 'visualdata_schema_pages';
		$conds = [
			'page_id' => $articleId,
			'schema_id' => $schemaId,
		];
		$insert = array_merge( $conds, [
			'updated_at' => $this->dateTime,
			'created_at' => $this->dateTime
		] );
		$this->updateOrInsert( $tableName, $conds, $insert );

		return $schemaId;
	}

	/**
	 * @param string $pointer
	 * @return string
	 */
	private function unescapeJsonPointer( $pointer ) {
		$ret = [];
		$arr = explode( '/', $pointer );
		foreach ( $arr as $value ) {
			$value = str_replace( '~1', '/', $value );
			$ret[] = str_replace( '~0', '~', $value );
		}
		return $ret;
	}

	/**
	 * @param string $part
	 * @return string
	 */
	public static function escapeJsonPointerPart( $part ) {
		$value = str_replace( '~', '~0', $part );
		return str_replace( '/', '~1', $value );
	}

	/**
	 * @param string $tableName
	 * @param array $conds
	 * @param array $insert
	 * @param array|null $update
	 * @return int
	 */
	private function updateOrInsert( $tableName, $conds, $insert, $update = null ) {
		$id = $this->dbr->selectField(
			$tableName,
			'id',
			$conds,
			__METHOD__,
			[ 'LIMIT' => 1 ]
		);

		if ( !$id ) {
			$res = $this->dbw->insert(
				$tableName,
				$insert
			);
			// @TODO use `mysql> select last_insert_id();`
			$id = $this->dbr->selectField(
				$tableName,
				'id',
				$conds,
				__METHOD__,
				[ 'ORDER BY' => 'id DESC' ]
			);
		}

		if ( !$update || !count( $update ) ) {
			return $id;
		}

		$res = $this->dbw->update(
			$tableName,
			$update,
			[ 'id' => $id ],
			__METHOD__
		);

		return $id;
	}

	/**
	 * @param string $type
	 * @param string $format
	 * @return array
	 */
	private function schemaFormatToTableId( $type, $format ) {
		$propType = ( $type === 'string' ? $format : $type );

		switch ( $propType ) {
			case 'number':
			case 'range':
				$propType = 'numeric';
				break;
			case 'date':
				$propType = 'date';
				break;
			case 'time':
				$propType = 'time';
				break;
			case 'datetime':
			case 'datetime-local':
				$propType = 'datetime';
				break;
			case 'week':
			case 'month':
				$propType = 'integer';
				break;
			case 'password':
			case 'color':
			case 'email':
			case 'tel':
			case 'text':
			case 'url':
				$propType = 'text';
				break;
			case 'textarea':
				$propType = 'textarea';
				break;
		}

		return [ $this->tableTypeToId( $propType ), $propType ];
	}

	/**
	 * @see resources/VisualDataForms.js -> processSchema
	 * @param array $schema
	 * @param array &$data
	 * @param string $path
	 * @param string $printout
	 * @param function $callback
	 * @param function $callbackValue
	 */
	public static function traverseData( $schema, &$data, $path, $printout, $callback, $callbackValue ) {
		switch ( $schema['type'] ) {
			case 'object':
				if ( isset( $schema['properties'] ) ) {
					foreach ( $schema['properties'] as $key => $value ) {
						$keyEscaped = self::escapeJsonPointerPart( $key );
						$currentPath = "$path/properties/$keyEscaped";
						$printout_ = ( $printout ? "$printout/$keyEscaped" : $keyEscaped );
						$subSchema = $schema['properties'][$key];
						$callback( $subSchema, $data, $currentPath, $printout_, $key );
						self::traverseData( $subSchema, $data[$key], $currentPath, $printout_, $callback, $callbackValue );
					}
				}
				break;
			case 'array':
				// @TODO support tuple

				if ( isset( $schema['items'] ) ) {
					$pathArr = explode( '/', $path );
					$key = array_pop( $pathArr );
					$callback( $schema, $data, $path, $printout, $key );

					$subSchema = $schema['items'];
					if ( is_array( $data ) ) {
						foreach ( $data as $key => $value ) {
							$currentPath = "$path/$key";
							self::traverseData( $subSchema, $data[$key], $currentPath, $printout, $callback, $callbackValue );
						}
					}
				}
				break;
			default:
				$pathArr = explode( '/', $path );
				$key = array_pop( $pathArr );
				$callbackValue( $schema, $data, $path, $printout, $key );
		}
	}

	/**
	 * @param array $schema
	 * @param array $data
	 * @return array
	 */
	public static function castDataRec( $schema, $data ) {
		$callback = static function ( $schema, &$data, $newPath, $printout, $newKey ) {
		};
		$callbackValue = static function ( $schema, &$value, $newPath, $printout, $newKey ) {
			$value = self::castValue( $schema, $value );
		};
		$printout = '';
		$path = '';
		self::traverseData( $schema, $data, $path, $printout, $callback, $callbackValue );
		return $data;
	}

	/**
	 * @see resources/VisualDataForms.js -> processSchema
	 * @param array $schema
	 * @param string $path
	 * @param string $printout
	 * @param function $callback
	 */
	public static function traverseSchema( $schema, $path, $printout, $callback ) {
		switch ( $schema['type'] ) {
			case 'object':
				if ( isset( $schema['properties'] ) ) {
					foreach ( $schema['properties'] as $key => $value ) {
						$keyEscaped = self::escapeJsonPointerPart( $key );
						$currentPath = "$path/properties/$keyEscaped";
						$printout_ = ( $printout ? "$printout/$keyEscaped" : $keyEscaped );
						$subSchema = $value;
						$callback( $subSchema, $currentPath, $printout_, $key );
						self::traverseSchema( $subSchema, $currentPath, $printout_, $callback );
					}
				}
				break;
			case 'array':
				// @TODO support tuple

				if ( isset( $schema['items'] ) ) {
					$pathArr = explode( '/', $path );
					$key = array_pop( $pathArr );
					$callback( $schema, $path, $printout, $key );
					$subSchema = $schema['items'];
					self::traverseSchema( $subSchema, $path, $printout, $callback );
				}
				break;
			default:
				// $pathArr = explode( '/', $path );
				// $key = array_pop( $pathArr );
				// $callback( $schema, $path, $printout, $key );
		}
	}

	/**
	 * @see resources/VisualDataForms.js -> processSchema
	 * @param array $schema
	 * @param array &$data
	 * @param array $renamed
	 * @param array $removed
	 * @param string $path
	 */
	public function processSchemaRec( $schema, &$data, $renamed, $removed, $path ) {
		if ( !$renamed && !$removed ) {
			return;
		}
		switch ( $schema['type'] ) {
			case 'object':
				$prevData = $data;
				$data = [];
				if ( isset( $schema['properties'] ) ) {
					foreach ( $schema['properties'] as $key => $value ) {
						$currentPath = "$path/properties/$key";
						if ( $renamed && $currentPath === $renamed[1] ) {
							$pathItemsOld = explode( '/', $renamed[0] );
							$keyOld = array_pop( $pathItemsOld );
							$data[$key] = $prevData[$keyOld];
							// unset( $data[$keyOld] );
						} elseif ( array_key_exists( $key, $prevData ) ) {
							$data[$key] = $prevData[$key];
						}
						// if ( $removed && $currentPath === $removed ) {
						// 	unset( $data[$key] );
						// }
						$subSchema = $schema['properties'][$key];
						$this->processSchemaRec( $subSchema, $data[$key], $renamed, $removed, $currentPath );
					}
				}
				break;
			case 'array':
				// @TODO support tuple
				if ( isset( $schema['items'] ) ) {
					$subSchema = $schema['items'];
					if ( is_array( $data ) ) {
						foreach ( $data as $key => $value ) {
							$currentPath = "$path/$key";
							$this->processSchemaRec( $subSchema, $data[$key], $renamed, $removed, $currentPath );
						}
					}
				}
				break;
		}
	}

	/**
	 * @param array $schema
	 * @param string $matchPath
	 * @return string
	 */
	public function getPrintoutOfPath( $schema, $matchPath ) {
		$ret = null;
		$callback = static function ( $schema, $path, $printout, $property ) use ( &$ret, $matchPath ) {
			if ( $path === $matchPath ) {
				$ret = $printout;
			}
		};

		$printout = '';
		$path = '';
		self::traverseSchema( $schema, $path, $printout, $callback );
		return $ret;
	}

	/**
	 * @param Title $title
	 * @param array $schema
	 */
	public function createSchemaIdAndPrintouts( $title, $schema ) {
		$rows = [];
		// @FIXME use only if used in all similar cases
		// $this->escapeJsonPointerPart( )
		$schemaId = $this->recordSchema( $title->getText() );
		$thisClass = $this;

		$callback = static function ( $schema, $path, $printout, $property ) use ( &$rows, $schemaId, $thisClass ) {
			[ $table_id, $propType ] = $thisClass->schemaFormatToTableId( $schema['type'],
				array_key_exists( 'format', $schema ) ? $schema['format'] : null );

			if ( !$table_id || !$propType ) {
				// @TODO log error
				return;
			}

			$rows[] = [
				'schema_id' => $schemaId,
				'table_id' => $table_id,
				'path_no_index' => $printout,
				'updated_at' => $thisClass->dateTime,
				'created_at' => $thisClass->dateTime,
			];
		};
		$path = '';
		$printout = '';
		self::traverseSchema( $schema, $path, $printout, $callback );

		$options = [ 'IGNORE' ];
		$tableName = 'visualdata_prop_tables';
		$res = $this->dbw->insert(
			$tableName,
			$rows,
			__METHOD__,
			$options
		);
	}

	/**
	 * @param string $type
	 * @return int
	 */
	public function tableTypeToId( $type ) {
		switch ( $type ) {
			case 'text':
				return 1;
			case 'textarea':
				return 2;
			case 'date':
				return 3;
			case 'datetime':
				return 4;
			case 'time':
				return 5;
			case 'integer':
				return 6;
			case 'numeric':
				return 7;
			case 'boolean':
				return 8;
		}

		return 0;
	}

	/**
	 * @param array $schema
	 * @param string|int|bool|number|null $value
	 * @return int
	 */
	private static function castValue( $schema, $value ) {
		SchemaProcessor::castType( $value, $schema );
		return $value;
	}

	/**
	 * @param string $context
	 * @param Title $title
	 * @param array $flattenData
	 * @param array &$errors
	 * @return int
	 */
	public function recordProperties( $context, $title, $flattenData, &$errors ) {
		$articleId = $title->getArticleID();

		$ret = 0;
		$props = [];
		foreach ( $flattenData as $path => $value ) {
			$pathArr = $this->unescapeJsonPointer( $path );
			$schemaName = array_shift( $pathArr );
			$schemas[] = $schemaName;

			// remove root slash
			// $pathNoIndex = substr( $value['pathNoIndex'], 1 );
			$pathNoIndex = $value['pathNoIndex'];
			$path = substr( $path, strpos( $path, '/' ) + 1 );
			$props[$schemaName][$path]['schema'] = $value['schema'];
			$props[$schemaName][$path]['pathNoIndex'] = $pathNoIndex;

			$props[$schemaName][$path]['value'] = $value['value'];
		}

		foreach ( $props as $schemaName => $values ) {
			$schemaId = $this->recordSchemaPage( $schemaName, $articleId );

			// delete all props related to this schema_id
			// and article

			// echo 'deleting values' . PHP_EOL;
			foreach ( self::$propTypes as $propType ) {
				$tableName = "visualdata_$propType";

				$this->dbw->deleteJoin(
					// delTable
					$tableName,
					// joinTable
					'visualdata_props',
					// delVar
					'prop_id',
					// joinVar
					$this->dbr->tableName( 'visualdata_props' ) . '.id',
					// conds
					[ 'page_id' => $articleId, 'schema_id' => $schemaId ],
					__METHOD__
				);
			}

			$rows = [];
			$mapPathNoIndexTableId = [];
			$mapPathNoIndexPropType = [];

			foreach ( $values as $path => $val ) {
				$path_no_index = $val['pathNoIndex'];

				if ( !array_key_exists( 'type', $val['schema'] ) ) {
					// @TODO log error
					continue;
				}

				[ $table_id, $propType ] = $this->schemaFormatToTableId( $val['schema']['type'],
					array_key_exists( 'format', $val['schema'] ) ? $val['schema']['format'] : null );

				if ( !$table_id || !$propType ) {
					// @TODO log error
					continue;
				}
				$mapPathNoIndexPropType[$path_no_index] = $propType;
				$mapPathNoIndexTableId[$path_no_index] = $table_id;

				$pathParent = substr( $path, 0, strrpos( $path, '/' ) );

				if ( !is_array( $val['value'] ) ) {
					$rows[] = [
						'schema_id' => $schemaId,
						'table_id' => $table_id,
						'path' => $path,
						'path_no_index' => $path_no_index,
						'path_parent' => $pathParent,
						'updated_at' => $this->dateTime,
						'created_at' => $this->dateTime,
					];
				} else {
					foreach ( $val['value'] as $k => $v ) {
						$rows[] = [
							'schema_id' => $schemaId,
							'table_id' => $table_id,
							'path' => "$path/$k",
							'path_no_index' => $path_no_index,
							'path_parent' => $pathParent,
							'updated_at' => $this->dateTime,
							'created_at' => $this->dateTime,
						];
					}
				}
			}

			$tableName = 'visualdata_props';
			$options = [ 'IGNORE' ];
			$res = $this->dbw->insert(
				$tableName,
				$rows,
				__METHOD__,
				$options
			);

			$conds = [ 'schema_id' => $schemaId ];
			$options = [];
			$joins = [];
			$tables = [ $tableName ];
			$res = $this->dbr->select(
				// tables
				$tables,
				// fields
				[ 'id', 'path' ],
				// where
				$conds,
				__METHOD__,
				// options
				$options,
				// join
				$joins
			);

			$mapPathPropId = [];
			foreach ( $res as $row ) {
				$mapPathPropId[$row->path] = $row->id;
			}

			$rows = [];
			foreach ( $mapPathNoIndexTableId as $path_no_index => $table_id ) {
				$rows[] = [
					'schema_id' => $schemaId,
					'table_id' => $table_id,
					'path_no_index' => $path_no_index,
					'updated_at' => $this->dateTime,
					'created_at' => $this->dateTime,
				];
			}

			$options = [ 'IGNORE' ];
			$tableName = 'visualdata_prop_tables';
			$res = $this->dbw->insert(
				$tableName,
				$rows,
				__METHOD__,
				$options
			);

			// @TODO use id instead of printouts

			// $options = [ 'IGNORE' ];
			// $tableName = $this->dbr->tableName( 'visualdata_printouts' );
			// $res = $this->dbw->insert(
			// 	$tableName,
			// 	$rows_,
			// 	__METHOD__,
			// 	$options
			// );

			// $conds = [ 'schema_id' => $schemaId ];
			// $options = [];
			// $joins = [];
			// $tables = [ $tableName ];
			// $res = $this->dbr->select(
			// 	// tables
			// 	$tables,
			// 	// fields
			// 	[ 'id', 'text' ],
			// 	// where
			// 	$conds,
			// 	__METHOD__,
			// 	// options
			// 	$options,
			// 	// join
			// 	$joins
			// );

			// $mapPrintoutId = [];
			// foreach ( $res as $row ) {
			// 	$mapPrintoutId[$row->text] = $row->id;
			// }

			$tables = [];
			foreach ( $values as $path => $val ) {
				$path_no_index = $val['pathNoIndex'];

				if ( !array_key_exists( $path_no_index, $mapPathNoIndexPropType ) ) {
					$this->errors[] = 'ERROR no printout ' . $path_no_index;
					continue;
				}

				$propType = $mapPathNoIndexPropType[$path_no_index];

				if ( !is_array( $val['value'] ) ) {
					if ( !array_key_exists( $path, $mapPathPropId ) ) {
						$this->errors[] = 'ERROR no prop with path ' . $path;
						continue;
					}
					$propId = $mapPathPropId[$path];
					$tables[$propType][] = [
						'page_id' => $articleId,
						'prop_id' => $propId,
						'value' => self::castValue( $val['schema'], $val['value'] ),
						'created_at' => $this->dateTime,
					];
				} else {
					foreach ( $val['value'] as $k => $v ) {
						if ( !array_key_exists( "$path/$k", $mapPathPropId ) ) {
							$this->errors[] = 'ERROR no prop with path' . "$path/$k";
							continue;
						}
						$propId = $mapPathPropId["$path/$k"];
						$tables[$propType][] = [
							'page_id' => $articleId,
							'prop_id' => $propId,
							'value' => self::castValue( $val['schema'], $v ),
							'created_at' => $this->dateTime,
						];
					}
				}
			}

			foreach ( $tables as $propType => $rows ) {
				$tableName = "visualdata_$propType";
				$res = $this->dbw->insert( $tableName, $rows );
				$ret += count( $rows );
			}
		}

		return $ret;
	}

	/**
	 * @param array &$ret
	 * @param array $schema
	 * @param array $data
	 * @param string $path
	 * @param string $pathNoIndex
	 */
	private function flattenData( &$ret, $schema, $data, $path, $pathNoIndex ) {
		foreach ( (array)$data as $key => $value ) {
			$keyEscaped = self::escapeJsonPointerPart( $key );
			$currentPath = $path ? "$path/$keyEscaped" : $keyEscaped;

			switch ( $schema['type'] ) {
				case 'object':
					if ( !array_key_exists( $key, $schema['properties'] ) ) {
						continue 2;
					}
					$currentPathNoIndex = $pathNoIndex ? "$pathNoIndex/$keyEscaped" : $keyEscaped;
					$subschema = $schema['properties'][$key];
					break;
				case 'array':
					$currentPathNoIndex = $pathNoIndex;
					// @FIXME handle tuple
					$subschema = $schema['items'] ?? [];
					break;
				default:
					if ( !array_key_exists( $key, $schema ) ) {
						continue 2;
					}
					$subschema = $schema[$key];
			}

			if ( is_array( $value ) ) {
				$this->flattenData( $ret, $subschema, $value, $currentPath, $currentPathNoIndex );
			} else {
				$ret[$currentPath] = [
					'pathNoIndex' => $currentPathNoIndex,
					'schema' => $subschema,
					'value' => $value
				];
			}
		}
	}

}
