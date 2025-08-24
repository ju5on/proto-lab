'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';


export default function MapView() {
	const mapRef = useRef<HTMLDivElement | null>(null);
	const mapObjRef = useRef<maplibregl.Map | null>(null);
	const path = location.href.replace('/index.html', '');

	useEffect(() => {
		if (!mapRef.current) return;

		const style: maplibregl.StyleSpecification = {
			version: 8,
			glyphs: './fonts/{fontstack}/{range}.pbf', // フォントデータを指定
			sources: {
				// 背景地図ソース
				osm: {
					type: 'raster',
					tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
					maxzoom: 19,
					tileSize: 256,
					attribution:
						'&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
				},
				admin: {
					type: 'vector', // ベクトルタイル
					tiles: [`${path}/tiles/{z}/{x}/{y}.pbf`],
					maxzoom: 8,
					attribution:
						'<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-v3_1.html">国土数値情報 - 行政区域データ</a>',
				},
				school: {
					type: 'geojson',
					data: './P29-21.geojson',
					attribution:
						'<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P29-v2_0.html">国土数値情報 - 学校データ</a>',
				},
				polygon: {
					type: 'geojson', // GeoJSON
					data: './A16-15_00_DID.geojson',
					attribution:
						'<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A16-v2_3.html">国土数値情報 - 人口集中地区データ</a>',
				},
				line: {
					type: 'geojson',
					data: './N02-21_RailroadSection.geojson',
					attribution:
						'<a href="https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N02-v3_0.html">国土数値情報 - 鉄道データ</a>',
				},
				lakebiwa: {
					type: 'image',
					url: './lakebiwa.jpg',
					coordinates: [
						[135.596438368833077, 35.5498836025608185],
						[136.5823028110609414, 35.5498836025608185],
						[136.5823028110609414, 34.9281476305997742],
						[135.596438368833077, 34.9281476305997742],
					],
				},
				// naturalearth: {
				// 	type: 'raster',
				// 	tiles: [`${path}/tiles_natural_earth/{z}/{x}/{y}.png`],
				// 	tileSize: 256,
				// 	maxzoom: 5,
				// 	attribution:
				// 		'<a href="https://www.naturalearthdata.com/">Natural Earth</a>',
				// },
			},
			layers: [
				{
					// 背景色
					id: 'background',
					type: 'background',
					paint: {
						'background-color': '#555', // グレー
					},
				},				
				{
					id: 'osm-layer',
					source: 'osm',
					type: 'raster',
					minzoom: 10,
					paint: {
						'raster-opacity': [
							'interpolate',
							['linear'],
							['zoom'],
							10, // ズームレベル10のときに
							0, // 透過度0%（透明）
							14, // ズームレベル14のときに
							0.7, // 透過度70%
						],
					},
				},
				{
					id: 'admin-layer',
					source: 'admin',
					'source-layer': 'admin',
					type: 'fill',
					paint: {
						'fill-color': '#6a3',
						'fill-opacity': [
							'interpolate',
							['linear'],
							['zoom'],
							10, // ズームレベル10のときに
							0.7, // 透過度70%
							14, // ズームレベル10のときに
							0.3, // 透過度30%
						],
						// 'fill-outline-color': '#00f',
					},
				},
				{
					id: 'admin-outline-layer',
					source: 'admin',
					'source-layer': 'admin',
					type: 'line',
					paint: {
						'line-color': '#373',
						'line-width': 4,
					},
				},
                {
					id: 'school-heatmap-layer', // 低ズームレベルでは、学校の位置情報をヒートマップとして表示
					source: 'school',
					type: 'heatmap',
					maxzoom: 12,
					paint: {
						'heatmap-weight': 0.01, // ポイントひとつあたりの重み
						'heatmap-opacity': 0.7,
						'heatmap-color': [
							'interpolate',
							['linear'],
							['heatmap-density'],
							0, // 重み0のときは
							'rgba(0, 0, 0, 0)', // 透明
							0.5, // 重み1のときは
							'rgba(255, 200, 0, 1)', // オレンジ色に
							1.0,
							'rgba(255, 240, 200, 1)',
						],
					},
				},
				{
					id: 'school-circle-layer', // 高ズームレベルでは、学校を点で表示
					source: 'school',
					type: 'circle',
					minzoom: 8,
					paint: {
						'circle-color': [
							'interpolate',
							['linear'],
							['get', 'P29_003'], // 学校種別コード
							16001, '#f00', // 小学校
							16002, '#0f0', // 中学校
							16003, '#0f0', // 中等教育学校
							16004, '#00f', // 高校
							16005, 'orange', // その他
						],
						'circle-opacity': [
							'interpolate',
							['linear'],
							['zoom'],
							8, // ズームレベル8のときに
							0, // 透過度0%
							9, // ズームレベル9のときに
							0.1, // 透過度10%
							14, // ズームレベル14のときに
							1, // 透過度100%
						],
					},
				},
				{
					id: 'school-label-layer',
					source: 'school',
					type: 'symbol', // フォント
					minzoom: 12,
					layout: {
						'text-field': ['get', 'P29_004'], // 学校名
						'text-font': ['Noto Sans CJK JP Bold'], // glyphsのフォントデータに含まれるフォント
						'text-offset': [0, 0.5],
						'text-anchor': 'top',
						'text-size': [
							'interpolate',
							['linear'],
							['zoom'],
							10, // ズームレベル10のときに
							8, // フォントサイズ8
							14, // ズームレベル14のときに
							14, // フォントサイズ14
						],
					},
					paint: {
						'text-halo-width': 1,
						'text-halo-color': '#fff',
					},
				},
				{
					id: 'polygon-layer',
					source: 'polygon',
					type: 'fill',
					paint: {
						'fill-color': [
							'rgba',
							255,
							0,
							0,
							[
								'min',
								1,
								[
									'/',
									[
										'/',
										['get', '人口'],
										['get', '面積'],
									],
									20000,
								],
							],
						],
					},
				},
				{
					id: 'line-layer',
					source: 'line',
					type: 'line',
					paint: {
						'line-color': [
							'case',
							['==', ['get', 'N02_002'], '1'], 'green',
							['==', ['get', 'N02_002'], '2'], '#00f', // blue
							['==', ['get', 'N02_002'], '3'], '#ff0000', // red
							['==', ['get', 'N02_002'], '4'], '#ffaa00', // orange
							['==', ['get', 'N02_002'], '5'], '#aa00ff', // purple
							'#000000',
						],
						'line-width': [
							'case',
							['==', ['get', 'N02_002'], '1'], 10,
							['==', ['get', 'N02_002'], '2'], 7,
							['==', ['get', 'N02_002'], '3'], 4,
							['==', ['get', 'N02_002'], '4'], 4,
							['==', ['get', 'N02_002'], '5'], 4,
							0,
						],
					},
					layout: {
						'line-cap': 'round',
					},
				},
				{
					id: 'lakebiwa-layer',
					source: 'lakebiwa',
					type: 'raster',
					paint: {
						'raster-opacity': 0.7,
					},
				},
				// {
				// 	id: 'naturalearth-layer',
				// 	source: 'naturalearth',
				// 	type: 'raster',
				// },
			],
		};

		// console.log("地図を初期化する準備OK");
		const map = new maplibregl.Map({
			container: mapRef.current,
			style,
			center: [139.6917, 35.6895], // 東京
			minZoom: 5,
			maxZoom: 18,
			// maxBounds:[122, 20, 154, 50],
			zoom: 5,
			attributionControl: false
		});

		// クリックハンドラから参照できるよう、作った地図をrefに入れる
		mapObjRef.current = map;

		map.addControl(new maplibregl.AttributionControl({
			compact: true,
			customAttribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
		}));

		map.addControl(
			new maplibregl.NavigationControl({ visualizePitch: true }),
			'top-left'
		);
		map.addControl(
			new maplibregl.ScaleControl({ unit: 'metric' }),
			'bottom-left'
		);

		map.on('click', (e) => {
			// marker.setLngLat(e.lngLat).addTo(map);

			// クリック地点にある地物全てを取得
			const features = map.queryRenderedFeatures(e.point, {
				layers: ['admin-layer'],
			});
			if (features.length === 0) return; 
			const feature = features[0];
			alert(
				`${feature.properties.N03_007}: ${feature.properties.N03_001}${feature.properties.N03_004}`,
			); // 市町村コード: 都道府県名市町村名
		})

		map.on('load', () => {
		});

		return () => map.remove();

	}, []);

	return <div id="map" ref={mapRef} />;
}