import { settings, primaryPhone, directionsLinks, fullAddress } from "@/lib/content";
import { hoursSummary, fmt } from "@/lib/hours";
import { Button } from "./Button";
import { OpenStatus } from "./OpenStatus";
import { MapEmbed } from "./MapEmbed";
import { IconArrow, IconClock, IconPhone, IconPin } from "./Icons";

/** Bloc « passage à l'action » : adresse, horaires, itinéraire, appel, carte. */
export function VisitBlock({ showHoursTable = false }: { showHoursTable?: boolean }) {
  const links = directionsLinks();
  return (
    <div className="grid gap-6 md:grid-cols-2 md:items-start">
      <div className="reveal space-y-5">
        <div className="flex items-start gap-3">
          <IconPin className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="font-semibold">{fullAddress()}</p>
            <p className="text-sm text-muted">{settings.address.landmark}.</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="font-semibold">{hoursSummary(settings.hours)}</p>
            <OpenStatus hours={settings.hours} className="mt-2" />
            {settings.demoMode && <p className="mt-2 text-xs text-gold">{settings.hoursNote}</p>}
          </div>
        </div>
        {showHoursTable && (
          <table className="w-full max-w-sm text-sm">
            <caption className="sr-only">Horaires d&apos;ouverture</caption>
            <tbody>
              {settings.hours.map((h) => (
                <tr key={h.day} className="border-b border-white/5">
                  <th scope="row" className="py-2 text-left font-normal capitalize text-muted">{h.day}</th>
                  <td className="py-2 text-right">{h.closed ? "Fermé" : `${fmt(h.open)} – ${fmt(h.close)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="flex items-start gap-3">
          <IconPhone className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <ul className="space-y-1">
            {settings.phones.map((p) => (
              <li key={p.number}>
                <a href={`tel:${p.number}`} className="font-semibold hover:text-accent">{p.display}</a>
                <span className="text-sm text-muted"> · {p.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:flex-wrap">
          <Button href={links.google}><IconArrow className="h-4 w-4" /> Obtenir l&apos;itinéraire</Button>
          <Button href={`tel:${primaryPhone.number}`} variant="ghost"><IconPhone className="h-4 w-4" /> Appeler Jackboy</Button>
          <Button href="/menu" variant="gold">Voir le menu</Button>
        </div>
        <p className="text-xs text-muted">
          Ouvrir avec{" "}
          <a className="underline underline-offset-2 hover:text-accent" href={links.waze} target="_blank" rel="noopener noreferrer">Waze</a> ou{" "}
          <a className="underline underline-offset-2 hover:text-accent" href={links.apple} target="_blank" rel="noopener noreferrer">Plans (iPhone)</a>
        </p>
      </div>
      <MapEmbed lat={settings.address.lat} lng={settings.address.lng} label={settings.name} />
    </div>
  );
}
