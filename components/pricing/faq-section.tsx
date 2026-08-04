'use client'

import { motion } from 'motion/react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQ = [
  {
    q: 'Puis-je changer de formule à tout moment ?',
    a: "Oui. Vous pouvez passer d'une formule à une autre depuis votre tableau de bord. Le changement est appliqué immédiatement et le tarif est ajusté au prorata.",
  },
  {
    q: 'Y a-t-il un engagement de durée ?',
    a: 'Aucun engagement. Vous pouvez résilier votre abonnement à tout moment depuis votre espace de gestion, sans frais ni justification.',
  },
  {
    q: 'Comment fonctionne la facturation 6 mois ou annuelle ?',
    a: 'En choisissant 6 mois ou 12 mois, vous payez une seule fois la totalité et bénéficiez d\'une remise de 15 % ou 35 %. La facture est générée automatiquement.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Vos données sont hébergées sur une infrastructure cloud sécurisée. La formule Business propose en plus une base de données isolée dédiée à votre agence.',
  },
  {
    q: 'Le support client est-il inclus ?',
    a: 'Toutes les formules incluent un support par email. Les formules Pro et Business bénéficient d\'un support WhatsApp prioritaire, avec un SLA garanti pour Business.',
  },
]

export function FaqSection() {
  return (
    <section className="relative px-6 pb-24">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-10 text-center"
        >
          <div className="mb-3 inline-flex items-center rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            FAQ
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions fréquentes
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Tout ce que vous devez savoir avant de choisir votre formule.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
          className="glass-strong rounded-2xl border border-border/60 px-6 py-2"
        >
          <Accordion type="single" collapsible className="w-full">
            {FAQ.map((item, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-border/60 last:border-b-0"
              >
                <AccordionTrigger className="text-left text-sm font-medium hover:no-underline sm:text-base">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
