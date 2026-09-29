# Porsche UI

Porsche UI is an unofficial web concept of a Porsche in-car screen, built around a 3D 911 GT3 RS. It is a design study: one wide PCM-style display that scales to fit the browser, with a car you can drive, open up and restyle.

## What it does

- **3D car:** a studio-lit 911 GT3 RS you can spin, with doors, front lid and engine lid that open, and a front-axle lift.
- **Showroom podium:** the car stands on a podium while parked. The podium fades away when you start driving.
- **Navigation:** a live map with a route through Cluj-Napoca to the airport. The demo drive follows the route on its own, slows for turns and stops at traffic lights.
- **Drive modes:** Wet, Normal, Sport and Track change throttle response, shift points and fuel use.
- **PDK and rev counter:** a 7-speed PDK picks the gear from speed and load. The rev bar runs to the 9,000 rpm limiter and flashes at the shift point.
- **Media:** a player with a track list and generated cover art.
- **Climate:** dual-zone temperature with SYNC, fan and seat heating.
- **Appearance:** paint, ambient lighting and headlights. These settings are remembered between visits.

## Controls

| Key | Action |
| --- | --- |
| W / ↑ | Throttle |
| S / ↓ | Brake |
| A | Demo drive on or off |
| M | Next drive mode (Shift+M for the previous one) |
| Space | Play or pause |
| ← / → | Previous or next track |
| H | Home |
| Esc | Close the open page |
| ? | Show the shortcuts |

## Stack

Next.js 16, React Three Fiber and three.js, MapLibre with OpenFreeMap tiles, Motion, Zustand, Tailwind CSS v4 and Bun.

## Running it

```bash
bun install
bun dev
```

Needs Node.js 20.9+.

## Credits

- **3D model:** "[Porsche GT3 RS](https://sketchfab.com/3d-models/porsche-gt3-rs-e738eae819c34d19a31dd066c45e0f3d)" by [Black Snow](https://sketchfab.com/BlackSnow02), licensed under [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/). Optimised for the web with gltf-transform.
- **Map:** map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, tiles by [OpenFreeMap](https://openfreemap.org/).
- **Font:** [Archivo](https://fonts.google.com/specimen/Archivo) by Omnibus-Type, under the SIL Open Font License.
- **Icons:** [Lucide](https://lucide.dev/license), under the ISC License.

## References

These are the designs, photos and videos the UI was studied from. None of their images are included in this repository.

### Concepts

- [Tesla UI](https://www.teslaui.com/) by [David K](https://x.com/dkrasniy): the idea of one in-car screen that scales to fit the browser.
- [Porsche Taycan HMI - UI Design](https://www.behance.net/gallery/214135773/Porsche-Taycan-HMI-UI-Design) by [Pierre Michel](https://www.behance.net/pierremichel), also on [Dribbble](https://dribbble.com/shots/25290711-Porsche-Taycan-HMI-UI-Design).
- 2024 Porsche 911 : HMI by [ZeroSixty](https://dribbble.com/ZeroSixty), shots [one](https://dribbble.com/shots/23126942-2024-Porsche-911-HMI) and [two](https://dribbble.com/shots/23134646-2024-Porsche-911-HMI).

### The real PCM

- Porsche Newsroom: [The new Porsche Taycan](https://newsroom.porsche.com/en/2024/products/porsche-the-new-taycan-35190.html) and the [Taycan press kit](https://newsroom.porsche.com/en/press-kits/taycan.html).
- Porsche Newsroom: [911 GT3 cockpit and interior](https://newsroom.porsche.com/en/press-kits/911-GT3/Cockpit-and-interior.html).
- Porsche USA: [Configure the PCM Home Screens in a 2025 Taycan](https://www.youtube.com/watch?v=d13TI6m0brM).
- Porsche USA: [Configure the PCM Home Screen and Themes in a 2025 Macan Electric](https://www.youtube.com/watch?v=EDOikPunGVs).
- Porsche USA: [Using the Passenger Display in a 2025 Taycan](https://www.youtube.com/watch?v=2Lwzb075KBw).
- Let's Torque Porsche: [How to Customise Your Macan Electric PCM Home Screen](https://www.youtube.com/watch?v=REBtNeYs2JQ).
- Car Creations: [How to use the four screens in a Porsche Taycan](https://www.youtube.com/watch?v=LYob6iiQKT4).
- Daily Motor: [2022 Porsche Macan infotainment review](https://www.youtube.com/watch?v=DgUCJ71-zX0).

### The car

- Porsche Newsroom: [the new Porsche 911 GT3 RS](https://newsroom.porsche.com/en/2022/products/porsche-911-gt3-rs-world-premiere-29177.html) and the [911 GT3 RS press kit](https://newsroom.porsche.com/dam/jcr:46a23375-e7ee-4507-a577-d9761b784d33/992%20911%20GT3%20RS%20Press%20Kit%201.pdf), for the engine, gearbox and drive-mode figures.

## Disclaimer

This is a personal design study. It is not affiliated with, endorsed by or connected to Dr. Ing. h.c. F. Porsche AG. Porsche, the Porsche crest, 911, GT3 RS, PCM, PDK and Taycan are trademarks of their owners. Tesla is a trademark of Tesla, Inc.
