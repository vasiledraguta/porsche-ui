import { Display } from "@/components/Display";
import { DemoControls, Ticker } from "@/components/Ticker";

export default function Home() {
  return (
    <main>
      <Ticker />
      <Display />
      <DemoControls />
    </main>
  );
}
