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

use Job;
use RequestContext;
use User;
use Wikimedia\ScopedCallback;

class UpdateDataJob extends Job {

	/**
	 * @param Title|Mediawiki\Title\Title $title
	 * @param array|bool $params
	 */
	function __construct( $title, $params = [] ) {
		parent::__construct( 'VisualDataUpdateDataJob', $title, $params );
	}

	/**
	 * @return bool
	 */
	function run() {
		// T279090
		$user = User::newFromId( $this->params['user_id'] );

		if ( !$user->isAllowed( 'visualdata-canmanageschemas' ) ) {
			$this->error = 'VisualData: Permission error';
			return false;
		}

		if ( isset( $this->params['session'] ) ) {
			$callback = RequestContext::importScopedSession( $this->params['session'] );
			$this->addTeardownCallback( static function () use ( &$callback ) {
				ScopedCallback::consume( $callback );
			} );
		}

		if ( $this->title === null ) {
			$this->error = "VisualData: Invalid title";
			return false;
		}

		$title = $this->title;

		if ( !array_key_exists( 'action', $this->params ) ) {
			$this->error = 'VisualData: internal error';
			return false;
		}

		$databaseManager = new DatabaseManager();
		$context = RequestContext::getMain();
		$context->setTitle( $title );

		$schemaProcessor = new SchemaProcessor( $context );

		if ( !empty( $this->params['schema'] ) ) {
			\VisualData::adjustSchemaName( $this->params['schema'] );
		}

		$errors = [];
		switch ( $this->params['action'] ) {
			case 'delete-schema':
				$databaseManager->deleteArticleSchemas( $title, [ $this->params['schema'] ], $errors );
				$jsonData = \VisualData::getJsonData( $title );

				if ( $jsonData && isset( $jsonData['schemas'] ) ) {
					unset( $jsonData['schemas'][$this->params['schema']] );
				}

				$targetSlot = \VisualData::getTargetSlot( $title );
				$slots = [
					$targetSlot => [
						'model' => CONTENT_MODEL_VISUALDATA_JSONDATA,
						'content' => $jsonData
					]
				];
				\VisualData::setJsonData(
					$user,
					$title,
					$slots,
					$errors,
				);
				break;
			case 'rename-schema':
				$jsonData = \VisualData::getJsonData( $title );

				if ( $jsonData && isset( $jsonData['schemas'] ) ) {
					$jsonData['schemas'][$this->params['new-label']] = $jsonData['schemas'][$this->params['previous-label']];
					unset( $jsonData['schemas'][$this->params['previous-label']] );
				}

				$targetSlot = \VisualData::getTargetSlot( $title );
				$slots = [
					$targetSlot => [
						'model' => CONTENT_MODEL_VISUALDATA_JSONDATA,
						'content' => $jsonData
					]
				];
				\VisualData::setJsonData(
					$user,
					$title,
					$slots,
					$errors,
				);
				break;
			case 'edit-schema':
				$jsonData = \VisualData::getJsonData( $title );

				if ( $jsonData && isset( $jsonData['schemas'] ) && isset( $jsonData['schemas'][$this->params['schema']] ) ) {
					$schemaName = $this->params['schema'];
					$schema = \VisualData::getSchema( $context, $schemaName );
					$renamed = $this->params['renamed'];
					$removed_ = $this->params['removed'];
					$removed = [];
					foreach ( $removed_ as $value ) {
						$parentPath = explode( '/', $value );
						$oldKey = array_pop( $parentPath );
						$removed[] = [ $parentPath, $oldKey ];
					}
					// 'added'
					$callback = static function ( $schema, &$data, $newPath, $printout, $newKey ) use ( $renamed, $removed ) {
						if ( in_array( $newPath, $renamed ) ) {
							$oldPathArr = explode( '/', array_search( $newPath, $renamed ) );
							$oldKey = array_pop( $oldPathArr );
							$data[$newKey] = $data[$oldKey];
							unset( $data[$oldKey] );
						}

						if ( count( $removed ) ) {
							$parentPath = substr( $newPath, 0, strrpos( $newPath, '/' ) );

							foreach ( $removed as $value_ ) {
								if ( $value_[0] === $parentPath ) {
									unset( $data[$value_[1]] );
								}
							}
						}
					};

					$printout = '';
					$path = '';
					$callbackValue = static function ( $schema, &$data, $newPath, $printout, $newKey ) {
					};
					DatabaseManager::traverseData( $schema, $jsonData['schemas'], $path, $printout, $callback, $callbackValue );

					$targetSlot = \VisualData::getTargetSlot( $title );
					$slots = [
						$targetSlot => [
							'model' => CONTENT_MODEL_VISUALDATA_JSONDATA,
							'content' => $jsonData
						]
					];
					\VisualData::setJsonData(
						$user,
						$title,
						$slots,
						$errors,
					);

					$slots = \VisualData::getSlots( $title );
					$content = $slots[$targetSlot]->getContent();
					\VisualData::rebuildArticleDataFromSlot( $user, $title, $content, $errors );
				}
				break;
		}

		return true;
	}

}
