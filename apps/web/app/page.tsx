import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center ">
      <main className="flex flex-col items-center justify-center flex-1">
        <h1 className="text-3xl font-bold">Hello World</h1>
          <Button>Click me</Button>
      </main>
    </div>
  );
}
