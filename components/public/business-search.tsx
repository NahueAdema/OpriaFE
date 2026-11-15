'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, MapPin, Scissors, Search } from 'lucide-react';
import { publicApi } from '@/lib/api';
import { Button, Card, Input, Select, Spinner } from '@/components/ui';
import { cn } from '@/lib/cn';

type BusinessSearchProps = {
  className?: string;
  autoFocus?: boolean;
};

/**
 * Public business directory shared by `/reservar` and `/cliente`. The term is
 * optional: a visitor can browse by city and service only.
 */
export function BusinessSearch({ className, autoFocus }: BusinessSearchProps) {
  const [term, setTerm] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [city, setCity] = useState('');
  const [service, setService] = useState('');

  const filtersQuery = useQuery({
    queryKey: ['public-business-filters'],
    queryFn: () => publicApi.getFilters(),
    staleTime: 5 * 60_000,
  });

  const hasCriteria = Boolean(submitted || city || service);

  const searchQuery = useQuery({
    queryKey: ['public-businesses', submitted, city, service],
    queryFn: () =>
      publicApi.searchBusinesses({
        q: submitted || undefined,
        city: city || undefined,
        service: service || undefined,
      }),
    enabled: hasCriteria,
  });

  const results = searchQuery.data?.items ?? [];
  const filters = filtersQuery.data;

  return (
    <>
      <form
        className={cn(
          'mx-auto mt-8 w-full max-w-3xl space-y-2',
          className,
        )}
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(term.trim());
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="Nombre del negocio (opcional)"
              aria-label="Buscar negocio"
              autoFocus={autoFocus}
              className="pl-9"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            aria-label="Filtrar por ciudad"
          >
            <option value="">Todas las ciudades</option>
            {(filters?.cities ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Select
            value={service}
            onChange={(event) => setService(event.target.value)}
            aria-label="Filtrar por servicio"
          >
            <option value="">Todos los servicios</option>
            {(filters?.services ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </form>

      <div className="mx-auto mt-8 w-full max-w-3xl space-y-3">
        {!hasCriteria ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            Buscá por nombre o elegí una ciudad o un servicio para ver negocios.
          </Card>
        ) : null}

        {searchQuery.isFetching ? (
          <Card className="flex items-center justify-center gap-3 p-6 text-sm text-slate-500">
            <Spinner />
            Buscando negocios…
          </Card>
        ) : null}

        {searchQuery.error ? (
          <Card className="p-4 text-sm text-rose-600">
            {searchQuery.error instanceof Error
              ? searchQuery.error.message
              : 'No pudimos buscar negocios.'}
          </Card>
        ) : null}

        {hasCriteria && !searchQuery.isFetching && results.length === 0 ? (
          <Card className="p-6 text-center text-sm text-slate-500">
            No encontramos negocios con esos filtros. Probá con otra ciudad,
            otro servicio u otro nombre.
          </Card>
        ) : null}

        {hasCriteria && !searchQuery.isFetching && results.length > 0 ? (
          <p className="px-1 text-xs font-medium tracking-wide text-slate-400 uppercase">
            {results.length} {results.length === 1 ? 'negocio' : 'negocios'}
          </p>
        ) : null}

        {results.map((business) => (
          <Link
            key={business.slug}
            href={`/reservar/${business.slug}`}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-indigo-50 text-indigo-600">
              {business.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logoUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Scissors className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {business.name}
              </p>
              <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
                {business.city || business.address ? (
                  <>
                    <MapPin className="h-3.5 w-3.5" />
                    {[business.city, business.address]
                      .filter(Boolean)
                      .join(' · ')}
                  </>
                ) : (
                  `${business.serviceCount} servicios disponibles`
                )}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>
        ))}
      </div>
    </>
  );
}
