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
 * @copyright Copyright ©2023, https://wikisphere.org
 */

// @see https://doc.wikimedia.org/oojs-ui/master/js/
// eslint-disable-next-line no-unused-vars
const VisualDataWindowManager = function () {
	var WindowManagers = [];
	var DialogName = 'dialog';

	function closeActiveWindow() {
		if ( !WindowManagers.length ) {
			return;
		}
		var windowManager = WindowManagers[ WindowManagers.length - 1 ];
		try {
			windowManager.removeWindows( [ DialogName ] );
		} catch ( exceptionVar ) {
		}
		windowManager.destroy();
	}

	function removeActiveWindow() {
		var windowManager = WindowManagers.pop();
		windowManager.destroy();
	}

	function newWindow( processDialog, data ) {
		// we create a new window manager for each new window
		// so we can use the same static name
		var windowManager = VisualDataFunctions.createWindowManager();
		WindowManagers.push( windowManager );

		windowManager.addWindows( [ processDialog ] );

		return windowManager.openWindow( processDialog, data );
	}

	return {
		newWindow,
		removeActiveWindow,
		closeActiveWindow
	};
};
