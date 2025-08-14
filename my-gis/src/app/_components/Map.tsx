'use client';

import { useEffect, useRef } from 'react';

import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MapView() {
	const mapRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!mapRef.current) return;

		const style: maplibregl.StyleSpecification = {
			version: 8,
			sources: {
				osm: {
					type: 'raster',
					tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
					tileSize: 256,
					attribution:
						'© OpenStreetMap contributors',
				},
			},
			layers: [
				{
					id: 'osm',
					type: 'raster',
					source: 'osm',
				},
			],
		};

		// console.log("地図を初期化する準備OK");
		const map = new maplibregl.Map({
			container: mapRef.current,
			style,
			center: [139.6917, 35.6895], // 東京
			zoom: 10,
		});

		const marker = new maplibregl.Marker();

		map.addControl(
			new maplibregl.NavigationControl({ visualizePitch: true }),
			'top-left'
		);
		map.addControl(
			new maplibregl.ScaleControl({ unit: 'metric' }),
			'bottom-left'
		);

		map.on('click', (e) => {
			marker.setLngLat(e.lngLat).addTo(map);
		})

		map.on('load', () => {
			map.addSource('spots', {
				type: 'geojson',
				data: '/sample.geojson',
			});
			map.addLayer({
				id: 'spots',
				type: 'circle',
				source: 'spots',
				paint: {
					'circle-radius': 12,
					'circle-color': '#2fab78',
				}
			});

			const onKeyDown = (e: KeyboardEvent) => {
				if (e.key !== 's' && e.key !== 'S') return;
				const current = map.getLayoutProperty('spots', 'visibility') as 'visible' | 'none' | undefined;
				const next: 'visible' | 'none' = current === 'none' ? 'visible' : 'none';
				map.setLayoutProperty('spots', 'visibility', next);
			};

			window.addEventListener('keydown', onKeyDown);

			map.on('remove', () => {
				window.removeEventListener('keydown', onKeyDown);
			});

			map.on('mouseenter', 'spots', () => {
				map.getCanvas().style.cursor = 'pointer';
			});
			map.on('mouseleave', 'spots', () => {
				map.getCanvas().style.cursor = '';
			});
			map.on('click', 'spots', (ev) => {
				type SpotProps = { name?: string; };
				const f = ev.features?.[0];
				if (!f) return;

				const props = f.properties as SpotProps || null;
				const name = props?.name ?? 'No Name';
				new maplibregl.Popup()
					.setLngLat(ev.lngLat)
					.setHTML(`<div style="font:12px/ 1.4 style-ui"><b>${name}</b></div>`)
					.addTo(map);
			});



		});

		return () => map.remove(); // クリーンアップ
	}, []);

	return <div id="map" ref={mapRef} />;
}