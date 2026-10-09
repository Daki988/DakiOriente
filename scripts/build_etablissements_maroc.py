#!/usr/bin/env python3
"""Construit le référentiel des établissements supérieurs privés du Maroc (Navigoal, destination unique : Maroc).

Règle Navigoal : seuls figurent les établissements qui délivrent des diplômes homologués par l'État,
et seules leurs filières homologuées (accréditation en cours pour l'année universitaire de référence ou au-delà).

Sources (data/sources/maroc/) :
  - registre_filieres_accreditees_2026-09-13.csv : cumul des arrêtés ministériels publiés au Bulletin officiel
    (listes annuelles 2021-2022 à 2025-2026 et arrêtés modificatifs), transcrit par Atlaris (atlaris.ma) ;
  - filieres_accreditees_eesp_2024-2025.json : liste officielle du ministère (enssup.gov.ma), avec diplôme et durée ;
  - reconnus_par_l_etat_2026.txt : liste officielle des universités et établissements reconnus par l'État (décrets) ;
  - autorisations_tables.json : listes officielles des établissements et universités privés autorisés (adresses, dates).
Le tableau ETABLISSEMENTS ci-dessous rattache chaque intitulé de ces sources à une fiche Navigoal (une université
regroupe ses facultés et écoles ; un établissement multi-villes a une fiche par ville, comme dans les textes).

Labels :
  - reconnu_etat        : université ou établissement reconnu par l'État (décret) ;
  - diplomes_homologues : établissement autorisé dont des filières sont accréditées par l'État ;
  - professionnel       : établissement de formation professionnelle privée accrédité (diplômes d'État) — attribué
                          depuis le back-office sur justificatif, faute de répertoire officiel publié récemment.

Usage : python3 scripts/build_etablissements_maroc.py [--annee 2026-2027]
"""
import argparse
import csv
import datetime
import json
import os
import re
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "sources", "maroc")
REF = os.path.join(ROOT, "data", "referentiels")


def norm(s):
    s = unicodedata.normalize("NFKD", (s or "").lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


# --------------------------------------------------------------------------------------------
# Fiches établissements. rec = rang dans la liste officielle des établissements reconnus (2026).
# match : expressions recherchées (sans accents, minuscules) dans « établissement + sigle » du registre ;
# ville : ville du registre (None = toutes). officiel : (sigle, ville) dans la liste ministérielle 2024-2025.
# --------------------------------------------------------------------------------------------
U, E = "universite", "ecole"
ETABLISSEMENTS = [
    # Universités
    dict(id="ma-uir", nom="Université Internationale de Rabat", sigle="UIR", ville="Rabat", type="universite", statut="partenariat_etat", rec=1,
         match=[r"universite internationale de rabat"]),
    dict(id="ma-um6ss", nom="Université Mohammed VI des Sciences de la Santé", sigle="UM6SS", ville="Casablanca", type="universite", statut="prive_non_lucratif", rec=2,
         match=[r"mohammed vi des sciences et de la sante", r"\bum6ss\b"]),
    dict(id="ma-uiass", nom="Université Internationale Abulcasis des Sciences de la Santé", sigle="UIASS", ville="Rabat", type="universite", statut="prive", rec=3,
         match=[r"abulcasis", r"\buiass\b"]),
    dict(id="ma-ueuromed", nom="Université Euromed de Fès", sigle="UEMF", ville="Fès", type="universite", statut="partenariat_etat", rec=4,
         match=[r"euromed"]),
    dict(id="ma-um6p", nom="Université Mohammed VI Polytechnique", sigle="UM6P", ville="Ben Guérir", type="universite", statut="prive_non_lucratif", rec=5,
         match=[r"\bum6p\b", r"mohammed vi polytechnique"]),
    dict(id="ma-upm", nom="Université Privée de Marrakech", sigle="UPM", ville="Marrakech", type="universite", statut="prive", rec=6,
         match=[r"universite privee de marrakech"]),
    dict(id="ma-universiapolis", nom="Université Internationale d'Agadir – Universiapolis", sigle="Universiapolis", ville="Agadir", type="universite", statut="prive", rec=7,
         match=[r"universiapolis", r"universite internationale d agadir"]),
    dict(id="ma-uic", nom="Université Internationale de Casablanca", sigle="UIC", ville="Casablanca", type="universite", statut="prive", rec=8,
         match=[r"universite internationale de casablanca"]),
    dict(id="ma-mundiapolis", nom="Université Mundiapolis", sigle="Mundiapolis", ville="Casablanca", type="universite", statut="prive", rec=12,
         match=[r"mundiapolis"]),
    dict(id="ma-upf", nom="Université Privée de Fès", sigle="UPF", ville="Fès", type="universite", statut="prive", rec=13,
         match=[r"universite privee de fes"]),
    dict(id="ma-upssa", nom="Université Privée de Santé et de Sciences d'Agadir", sigle="UPSSA", ville="Agadir", type="universite", statut="prive",
         match=[r"\bupssa\b", r"universite privee de sante et de sciences d agadir"]),
    dict(id="ma-averroes", nom="Université Internationale Privée Averroès", sigle="Averroès", ville="Casablanca", type="universite", statut="prive",
         match=[r"ibn rochd", r"averroes"]),
    dict(id="ma-uao", nom="Université Arabe Ouverte – Maroc", sigle="UAO", ville="Casablanca", type="universite", statut="prive",
         match=[r"universite arabe ouverte"]),
    # Écoles et instituts reconnus par l'État
    dict(id="ma-eac", nom="École Supérieure d'Architecture de Casablanca", sigle="EAC", ville="Casablanca", type="architecture", statut="prive", rec=9,
         match=[r"architecture de casablanca"], officiel=[("EAC", "Casablanca")]),
    dict(id="ma-ecc", nom="École Centrale Casablanca", sigle="ECC", ville="Casablanca", type="ecole_ingenieurs", statut="partenariat_etat", rec=10,
         match=[r"centrale casablanca", r"ecole centrale de casablanca"], officiel=[("ECC", "Casablanca")]),
    dict(id="ma-esca", nom="ESCA École de Management", sigle="ESCA", ville="Casablanca", type="ecole_commerce", statut="prive", rec=11,
         match=[r"\besca\b"], officiel=[("ESCA", "Casablanca")]),
    dict(id="ma-supdeco-marrakech", nom="Sup de Co – École Supérieure de Commerce de Marrakech", sigle="Sup de Co", ville="Marrakech", type="ecole_commerce", statut="prive", rec=14,
         match=[r"sup de co", r"superieure de commerce de marrakech"]),
    dict(id="ma-estem", nom="ESTEM – École Supérieure en Ingénierie, Management et Génie Civil", sigle="ESTEM", ville="Casablanca", type="ecole_ingenieurs", statut="prive", rec=15,
         match=[r"\bestem\b"], officiel=[("ESTEM Sup Privée", "Casablanca")]),
    dict(id="ma-iga", nom="Institut Supérieur du Génie Appliqué", sigle="IGA", ville="Casablanca", type="ecole_ingenieurs", statut="prive", rec=16,
         match=[r"genie applique"], officiel=[("IGA", "Casablanca")]),
    dict(id="ma-emsi-casablanca", nom="EMSI – École Marocaine des Sciences de l'Ingénieur (Casablanca)", sigle="EMSI", ville="Casablanca", type="ecole_ingenieurs", statut="prive", rec=17,
         match=[r"marocaine des sciences de l ingenieur"], villes=["Casablanca"], officiel=[("EMSI", "Casablanca")]),
    dict(id="ma-emsi-rabat", nom="EMSI – École Marocaine des Sciences de l'Ingénieur (Rabat)", sigle="EMSI", ville="Rabat", type="ecole_ingenieurs", statut="prive", rec=18,
         match=[r"marocaine des sciences de l ingenieur"], villes=["Rabat"], officiel=[("EMSI", "Rabat")]),
    dict(id="ma-emsi-marrakech", nom="EMSI – École Marocaine des Sciences de l'Ingénieur (Marrakech)", sigle="EMSI", ville="Marrakech", type="ecole_ingenieurs", statut="prive", rec=19,
         match=[r"marocaine des sciences de l ingenieur"], villes=["Marrakech"], officiel=[("EMSI", "Marrakech")]),
    dict(id="ma-emsi-tanger", nom="EMSI – École Marocaine des Sciences de l'Ingénieur (Tanger)", sigle="EMSI", ville="Tanger", type="ecole_ingenieurs", statut="prive", rec=41,
         match=[r"marocaine des sciences de l ingenieur"], villes=["Tanger"], officiel=[("EMSI Tanger", "Tanger")]),
    dict(id="ma-emsi-fes", nom="EMSI – École Marocaine des Sciences de l'Ingénieur (Fès)", sigle="EMSI", ville="Fès", type="ecole_ingenieurs", statut="prive",
         match=[r"marocaine des sciences de l ingenieur"], villes=["Fès"], officiel=[("EMSI Fès", "Fès")]),
    dict(id="ma-isga-rabat", nom="ISGA – Institut Supérieur d'Ingénierie et des Affaires (Rabat)", sigle="ISGA", ville="Rabat", type="ecole_ingenieurs", statut="prive", rec=20,
         match=[r"ingenierie et des affaires"], villes=["Rabat"], officiel=[("ISGA Rabat", "Rabat")]),
    dict(id="ma-isga-fes", nom="ISGA – Institut Supérieur d'Ingénierie et des Affaires (Fès)", sigle="ISGA", ville="Fès", type="ecole_ingenieurs", statut="prive", rec=21,
         match=[r"ingenierie et des affaires"], villes=["Fès"], officiel=[("ISGA Fès", "Fès")]),
    dict(id="ma-isga-marrakech", nom="ISGA – Institut Supérieur d'Ingénierie et des Affaires (Marrakech)", sigle="ISGA", ville="Marrakech", type="ecole_ingenieurs", statut="prive", rec=22,
         match=[r"ingenierie et des affaires"], villes=["Marrakech"], officiel=[("ISGA Marrakech", "Marrakech")]),
    dict(id="ma-isga-casablanca", nom="ISGA – Institut Supérieur d'Ingénierie et des Affaires (Casablanca)", sigle="ISGA", ville="Casablanca", type="ecole_ingenieurs", statut="prive", rec=33,
         match=[r"ingenierie et des affaires"], villes=["Casablanca"], officiel=[("ISGA Casablanca", "Casablanca")]),
    dict(id="ma-emg", nom="École Marocaine d'Ingénierie", sigle="EMG", ville="Rabat", type="ecole_ingenieurs", statut="prive", rec=23,
         match=[r"ecole marocaine d ingenierie"], officiel=[("EMG", "Rabat")]),
    dict(id="ma-istl", nom="Institut Supérieur du Transport et de la Logistique", sigle="ISTL", ville="Casablanca", type="institut", statut="prive", rec=24,
         match=[r"transports? et de la logistique"], officiel=[("ISTL", "Casablanca")]),
    dict(id="ma-hem", nom="HEM – Institut des Hautes Études de Management (Casablanca)", sigle="HEM", ville="Casablanca", type="ecole_commerce", statut="prive", rec=25,
         match=[r"hautes etudes de management"], villes=["Casablanca"], officiel=[("HEM Casablanca", "Casablanca")]),
    dict(id="ma-heec", nom="HEEC – École des Hautes Études Économiques, Commerciales et d'Ingénierie", sigle="HEEC", ville="Marrakech", type="ecole_commerce", statut="prive", rec=26,
         match=[r"\bheec\b", r"hautes etudes economiques commerciales"], officiel=[("HEEC", "Marrakech")]),
    dict(id="ma-supmanagement", nom="Sup'Management – École Supérieure de Management, de Commerce et d'Informatique", sigle="Sup'Management", ville="Fès", type="ecole_commerce", statut="prive", rec=27,
         match=[r"sup management"]),
    dict(id="ma-iihem", nom="International Institute for Higher Education in Morocco", sigle="IIHEM", ville="Rabat", type="ecole_commerce", statut="prive", rec=28,
         match=[r"\biihem\b", r"international institute for higher education"]),
    dict(id="ma-eigsi-casa", nom="EIGSI Casablanca – École d'Ingénierie en Génie des Systèmes Industriels", sigle="EIGSICA", ville="Casablanca", type="ecole_ingenieurs", statut="prive", rec=29,
         match=[r"\beigsica\b", r"systemes industriels"], villes=["Casablanca"], officiel=[("EIGSICA", "Casablanca")]),
    dict(id="ma-supmti-rabat", nom="SUPMTI – École Supérieure de Management, Informatique et Télécommunication (Rabat)", sigle="SUPMTI", ville="Rabat", type="ecole_ingenieurs", statut="prive", rec=30,
         match=[r"\bsupmti\b"], villes=["Rabat"], officiel=[("SUPMTI Rabat", "Rabat")]),
    dict(id="ma-eheio", nom="EHEIO – École des Hautes Études d'Ingénierie", sigle="EHEIO", ville="Oujda", type="ecole_ingenieurs", statut="prive", rec=31,
         match=[r"hautes etudes d ingenierie"], villes=["Oujda"], officiel=[("EHEIO", "Oujda")]),
    dict(id="ma-emaa", nom="EMAA – École de Management et d'Administration des Affaires", sigle="EMAA", ville="Agadir", type="ecole_commerce", statut="prive", rec=32,
         match=[r"\bemaa\b", r"management et d administration des affaires"], officiel=[("EMAA", "Agadir")]),
    dict(id="ma-ismagi", nom="ISMAGI – Institut Supérieur de Management, d'Administration et de Génie Informatique", sigle="ISMAGI", ville="Rabat", type="institut", statut="prive", rec=34,
         match=[r"\bismagi\b"], officiel=[("ISMAGI", "Rabat")]),
    dict(id="ma-hestim", nom="HESTIM – École des Hautes Études en Sciences et Techniques de l'Ingénierie et du Management", sigle="HESTIM", ville="Casablanca", type="ecole_ingenieurs", statut="prive", rec=35,
         match=[r"\bhestim\b"], officiel=[("HESTIM", "Casablanca")]),
    dict(id="ma-heci-casa", nom="HECI – École des Hautes Études Commerciales et Informatiques (Casablanca)", sigle="HECI", ville="Casablanca", type="ecole_commerce", statut="prive", rec=36,
         match=[r"\bheci\b"], villes=["Casablanca"]),
    dict(id="ma-essem", nom="ESSEM Business School – École Supérieure des Sciences Économiques et de Management", sigle="ESSEM", ville="Casablanca", type="ecole_commerce", statut="prive", rec=37,
         match=[r"\bessem\b"]),
    dict(id="ma-suprh", nom="SUP'RH – École Supérieure de Management et de Gestion des Ressources Humaines", sigle="SUP'RH", ville="Casablanca", type="ecole_commerce", statut="prive", rec=38,
         match=[r"sup ?rh\b", r"gestion des ressources humaines"], officiel=[("SUPRH", "Casablanca")]),
    dict(id="ma-esss", nom="École Supérieure des Sciences de la Santé", sigle="ESSS", ville="Casablanca", type="ecole_sante", statut="prive", rec=39,
         match=[r"ecole superieure des sciences de la sante$", r"\besss\b"]),
    dict(id="ma-ensit", nom="ENSIT – École des Nouvelles Sciences et Ingénierie", sigle="ENSIT", ville="Tanger", type="ecole_ingenieurs", statut="prive", rec=40,
         match=[r"\bensit\b", r"sciences modernes et d ingenierie", r"nouvelles sciences et ingenierie"], officiel=[("ENSIT", "Tanger")]),
    dict(id="ma-hecf-fes", nom="HECF – École des Hautes Études Comptables et Financières (Fès)", sigle="HECF", ville="Fès", type="ecole_commerce", statut="prive", rec=42,
         match=[r"\bhecf\b", r"comptabilite et finance"], villes=["Fès"]),
    dict(id="ma-eamr", nom="École Arts et Métiers – Campus de Rabat", sigle="EAMR", ville="Salé", type="ecole_ingenieurs", statut="partenariat_etat", rec=43,
         match=[r"arts et metiers"], officiel=[("EAMR", "Salé")]),
    dict(id="ma-suptech-sante", nom="SUPTECH Santé – École Supérieure de Génie Biomédical et des Techniques de Santé (Mohammedia)", sigle="SUPTECH Santé", ville="Mohammedia", type="ecole_sante", statut="partenariat_etat", rec=44,
         match=[r"suptech sante"], villes=["Mohammedia"], officiel=[("ESGBTSP", "Mohammadia")]),
    dict(id="ma-psychosup", nom="École Supérieure de Psychologie", sigle="ESP", ville="Casablanca", type="institut", statut="prive", rec=45,
         match=[r"superieure de psychologie"]),
    dict(id="ma-supemir", nom="SUPEMIR – École Supérieure des Multimédia, Informatique et Réseaux", sigle="SUPEMIR", ville="Casablanca", type="ecole_ingenieurs", statut="prive", rec=46,
         match=[r"\bsupemir\b"]),
    dict(id="ma-eheb", nom="EHEB – École des Hautes Études de Biotechnologie et de Santé", sigle="EHEB", ville="Casablanca", type="ecole_sante", statut="prive", rec=47,
         match=[r"\beheb\b", r"biotechnologie et de sante"]),
    dict(id="ma-esisa", nom="ESISA – École Supérieure d'Ingénierie en Sciences Appliquées", sigle="ESISA", ville="Fès", type="ecole_ingenieurs", statut="prive", rec=48,
         match=[r"\besisa\b"]),
    dict(id="ma-escga", nom="ESCGA – École Supérieure de Commerce et de Gestion des Affaires", sigle="ESCGA", ville="Tanger", type="ecole_commerce", statut="prive", rec=49,
         match=[r"\bescga\b", r"commerce et de gestion d entreprises"]),
    dict(id="ma-suptech-sante-essaouira", nom="SUPTECH Santé Essaouira – École Supérieure de Génie Biomédical et des Techniques de Santé", sigle="SUPTECH Santé", ville="Essaouira", type="ecole_sante", statut="prive", rec=50,
         match=[r"suptech sante"], villes=["Essaouira"], officiel=[("SUPTECH SANTE Essaouira", "Essaouira")]),
    dict(id="ma-suptech-environnement", nom="SUPTECH Environnement – École Supérieure des Technologies de l'Eau, de l'Énergie et du Développement Durable", sigle="SUPTECH Environnement", ville="Mohammedia", type="ecole_ingenieurs", statut="prive", rec=51,
         match=[r"suptech environnement", r"techniques de l eau"], officiel=[("SUPTECH ENVIRONNEMENT", "Mohammadia")]),
    dict(id="ma-esiai", nom="ESIAI – École Supérieure d'Ingénierie Appliquée et Innovation", sigle="ESIAI", ville="Oujda", type="ecole_ingenieurs", statut="prive", rec=52,
         match=[r"ingenierie appliquee et d innovation"], villes=["Oujda"], officiel=[("", "Oujda")]),
    dict(id="ma-artcomsup-casa", nom="Art'Com Sup – École Supérieure de Design et de Communication (Casablanca)", sigle="Art'Com Sup", ville="Casablanca", type="arts_design", statut="prive", rec=53,
         match=[r"art ?com sup", r"ecole superieure de design"], villes=["Casablanca"]),
    dict(id="ma-artcomsup-rabat", nom="Art'Com Sup – École Supérieure de Design (Rabat)", sigle="Art'Com Sup", ville="Rabat", type="arts_design", statut="prive", rec=54,
         match=[r"art ?com sup", r"ecole superieure de design"], villes=["Rabat"]),
    dict(id="ma-hightech", nom="HIGH-TECH – High Technology School in Morocco", sigle="HIGH-TECH", ville="Rabat", type="ecole_ingenieurs", statut="prive", rec=55,
         match=[r"high ?tech"]),
    dict(id="ma-iheps-agadir", nom="IHEPS – Institut des Hautes Études Paramédicales du Souss", sigle="IHEPS", ville="Agadir", type="ecole_sante", statut="prive", rec=56,
         match=[r"paramedicales du souss"]),
    dict(id="ma-supmti-meknes", nom="SUPMTI – École Supérieure de Management, Informatique et Télécommunication (Meknès)", sigle="SUPMTI", ville="Meknès", type="ecole_ingenieurs", statut="prive", rec=57, rec_en_cours=True,
         match=[r"\bsupmti\b", r"management d informatique et de telecommunication"], villes=["Meknès"]),
    # Établissements autorisés aux filières accréditées
    dict(id="ma-supmti-oujda", nom="SUPMTI – École Supérieure de Management, Informatique et Télécommunication (Oujda)", sigle="SUPMTI", ville="Oujda", type="ecole_ingenieurs", statut="prive",
         match=[r"\bsupmti\b", r"management d informatique et de telecommunication"], villes=["Oujda"], officiel=[("SUPMTI Oujda", "Oujda")]),
    dict(id="ma-supmti-benimellal", nom="SUPMTI – École Supérieure de Management, Informatique et Télécommunication (Béni Mellal)", sigle="SUPMTI", ville="Béni Mellal", type="ecole_ingenieurs", statut="prive",
         match=[r"\bsupmti\b"], villes=["Béni Mellal"]),
    dict(id="ma-edge", nom="EDGE Business School", sigle="EDGE", ville="Casablanca", type="ecole_commerce", statut="prive",
         match=[r"\bedge\b"], officiel=[("EDGE", "Casablanca")]),
    dict(id="ma-aes", nom="Atlantic Engineering School", sigle="AES", ville="Casablanca", type="ecole_ingenieurs", statut="prive",
         match=[r"atlantique privee d ingenierie"], officiel=[("AES", "Casablanca")]),
    dict(id="ma-abs", nom="Atlantic Business School", sigle="ABS", ville="Casablanca", type="ecole_commerce", statut="prive",
         match=[r"atlantic business school", r"atlantique privee de management"], officiel=[("", "Casablanca")]),
    dict(id="ma-eskp", nom="École Supérieure de Kinésithérapie et Paramédicale", sigle="ESKP", ville="Casablanca", type="ecole_sante", statut="prive",
         match=[r"\beskp\b", r"kinesitherapie et du paramedical"], officiel=[("ESKP", "Casablanca")]),
    dict(id="ma-esi2a", nom="ESI2A – École Supérieure d'Ingénierie Automobile et Aéronautique", sigle="ESI2A", ville="Fès", type="ecole_ingenieurs", statut="prive",
         match=[r"\besi2a\b", r"ingenierie automobile"], officiel=[("ESI2A", "Fès")]),
    dict(id="ma-sist-tanger", nom="SIST – Superior Institutes of Sciences and Technology (Tanger)", sigle="SIST", ville="Tanger", type="institut", statut="prive",
         match=[r"\bsist\b", r"instituts superieurs des sciences et technologies"], villes=["Tanger"], officiel=[("SIST Tanger", "Tanger")]),
    dict(id="ma-sist-rabat", nom="SIST – Superior Institutes of Sciences and Technology (Rabat)", sigle="SIST", ville="Rabat", type="institut", statut="prive",
         match=[r"\bsist\b", r"instituts superieurs des sciences et technologies"], villes=["Rabat"]),
    dict(id="ma-sist-casablanca", nom="SIST – Superior Institutes of Sciences and Technology (Casablanca)", sigle="SIST", ville="Casablanca", type="institut", statut="prive",
         match=[r"\bsist\b", r"instituts superieurs des sciences et technologies"], villes=["Casablanca"], officiel=[("SIST", "Casablanca")]),
    dict(id="ma-esgcnt", nom="École Supérieure de Génie Civil et des Technologies Nouvelles", sigle="ESGCNT", ville="Meknès", type="ecole_ingenieurs", statut="prive",
         match=[r"\besgcnt\b"]),
    dict(id="ma-eso", nom="ESO – École Supérieure d'Optique Appliquée et du Paramédical", sigle="ESO", ville="Rabat", type="ecole_sante", statut="prive",
         match=[r"\beso\b", r"optique appliquee"], officiel=[("ESO", "Rabat")]),
    dict(id="ma-iheps-casa", nom="IHEPS – Institut des Hautes Études Paramédicales et Sociales (Casablanca)", sigle="IHEPS", ville="Casablanca", type="ecole_sante", statut="prive",
         match=[r"paramedicales et sociales"]),
    dict(id="ma-iheps-marrakech", nom="IHEPS – Institut des Hautes Études Paramédicales du Sud (Marrakech)", sigle="IHEPS", ville="Marrakech", type="ecole_sante", statut="prive",
         match=[r"paramedicales du sud"]),
    dict(id="ma-isfort", nom="ISFORT – Institut Supérieur de Formation en Technologies Alimentaires", sigle="ISFORT", ville="Casablanca", type="institut", statut="prive",
         match=[r"\bisfort\b"], officiel=[("ISFORT", "Casablanca")]),
    dict(id="ma-es2im", nom="ES2IM – École Supérieure d'Ingénierie Informatique et Multimédia", sigle="ES2IM", ville="Casablanca", type="ecole_ingenieurs", statut="prive",
         match=[r"\bes2im\b"]),
    dict(id="ma-ilcs", nom="ILCS – Institute for Language and Communication Studies", sigle="ILCS", ville="Rabat", type="institut", statut="prive",
         match=[r"\bilcs\b"]),
    dict(id="ma-essti", nom="ESSTI – École Supérieure des Sciences et Technologies de l'Ingénierie", sigle="ESSTI", ville="Rabat", type="ecole_ingenieurs", statut="prive",
         match=[r"\bessti\b"], officiel=[("ESSTI", "Rabat")]),
    dict(id="ma-esrmi", nom="ESRMI – École Supérieure de Rabat en Management et Ingénierie", sigle="ESRMI", ville="Rabat", type="ecole_commerce", statut="prive",
         match=[r"\besrmi\b"]),
    dict(id="ma-ispsni", nom="Institut Supérieur Privé des Sciences de la Numérisation et de l'Information", sigle="ISPSNI", ville="Tétouan", type="institut", statut="prive",
         match=[r"\bispsni\b"]),
    dict(id="ma-iimc", nom="IIMC – International Institute of Management Casablanca", sigle="IIMC", ville="Bouskoura", type="ecole_commerce", statut="prive",
         match=[r"institut international de casablanca de management"]),
    dict(id="ma-isps", nom="ISPS – Institut Spécialisé Privé des Sciences de la Santé", sigle="ISPS", ville="Casablanca", type="ecole_sante", statut="prive",
         match=[r"\bisps\b"]),
    dict(id="ma-aerosup", nom="AERO'SUP – École Supérieure de l'Aéronautique et des Hautes Technologies", sigle="AERO'SUP", ville="Casablanca", type="ecole_ingenieurs", statut="prive",
         match=[r"aero ?sup"], officiel=[("AEROSUP", "Casablanca")]),
    dict(id="ma-esa-casa", nom="ESA Casablanca – École Supérieure des Affaires", sigle="ESA", ville="Casablanca", type="ecole_commerce", statut="prive",
         match=[r"\besac\b"]),
    dict(id="ma-innov", nom="INNOV'INFO – École Supérieure de l'Innovation Informatique et Technologique", sigle="INNOV'INFO", ville="Casablanca", type="ecole_ingenieurs", statut="prive",
         match=[r"\binnov\b"], officiel=[("INNOV INFO", "Casablanca")]),
    dict(id="ma-hecgi", nom="HECGI – Hautes Études de Commerce, de Gestion et d'Informatique", sigle="HECGI", ville="Kénitra", type="ecole_commerce", statut="prive",
         match=[r"\bhecgi\b"]),
    dict(id="ma-icacsup", nom="ICACSUP – Institut Supérieur de Comptabilité, d'Administration et de Commerce", sigle="ICACSUP", ville="Kénitra", type="ecole_commerce", statut="prive",
         match=[r"\bicacsup\b"]),
    dict(id="ma-gecm", nom="Grande École de Commerce de Marrakech", sigle="GECM", ville="Marrakech", type="ecole_commerce", statut="prive",
         match=[r"\bgecm\b"]),
    dict(id="ma-esav", nom="ESAV – École Supérieure des Arts Visuels de Marrakech", sigle="ESAV", ville="Marrakech", type="arts_design", statut="prive",
         match=[r"\besav\b", r"arts visuels"], officiel=[("ESAV", "Marrakech")]),
    dict(id="ma-hecf-meknes", nom="HECF – École des Hautes Études Comptables et Financières (Meknès)", sigle="HECF", ville="Meknès", type="ecole_commerce", statut="prive",
         match=[r"\bhecf\b"], villes=["Meknès"]),
    dict(id="ma-emsig", nom="EMSIG – École Marocaine Supérieure d'Informatique et de Gestion", sigle="EMSIG", ville="Meknès", type="ecole_commerce", statut="prive",
         match=[r"\bemsig\b"], officiel=[("EMSIG", "Meknès")]),
    dict(id="ma-hbfg-oujda", nom="HBFG – Institut des Hautes Études Bancaires, Financières et de Gestion (Oujda)", sigle="HBFG", ville="Oujda", type="ecole_commerce", statut="prive",
         match=[r"\bhbfg\b"], villes=["Oujda"], officiel=[("HBFG Oujda", "Oujda")]),
    dict(id="ma-hec-maroc", nom="HEC Maroc – École des Hautes Études Commerciales (Rabat)", sigle="HEC", ville="Rabat", type="ecole_commerce", statut="prive",
         match=[r"^ecole des hautes etudes commerciales hec\b", r"\bhec\b"], villes=["Rabat"], officiel=[("HEC", "Rabat")]),
    dict(id="ma-junia", nom="JUNIA Maroc – École d'Ingénierie", sigle="JUNIA Maroc", ville="Rabat", type="ecole_ingenieurs", statut="prive",
         match=[r"junia", r"yncrea"]),
    dict(id="ma-esai", nom="ESAI – École Supérieure d'Architecture d'Intérieur", sigle="ESAI", ville="Rabat", type="arts_design", statut="prive",
         match=[r"\besai\b"], villes=["Rabat"]),
    dict(id="ma-essec-sale", nom="ESSEC – École des Sciences Économiques et Commerciales (Salé)", sigle="ESSEC", ville="Salé", type="ecole_commerce", statut="prive",
         match=[r"\bessec\b"], officiel=[("ESSEC", "Salé")]),
    dict(id="ma-medsup", nom="MEDSUP – École Supérieure du Management des Entreprises du Détroit", sigle="MEDSUP", ville="Tanger", type="ecole_commerce", statut="prive",
         match=[r"medsup"]),
    dict(id="ma-esjc", nom="ESJC – École Supérieure de Journalisme et de Communication", sigle="ESJC", ville="Casablanca", type="institut", statut="prive",
         match=[r"\besjc\b"]),
    dict(id="ma-ippc", nom="Institut Polytechnique Privé de Casablanca", sigle="IPPC", ville="Casablanca", type="ecole_ingenieurs", statut="prive",
         match=[r"institut polytechnique prive de casablanca"], officiel=[("ZERO", "Casablanca")]),
    dict(id="ma-ispep", nom="ISPEP – Institut Supérieur Privé des Études Paramédicales", sigle="ISPEP", ville="Casablanca", type="ecole_sante", statut="prive",
         match=[r"\bispep\b"], officiel=[("ISPEP", "Casablanca")]),
    dict(id="ma-comsup", nom="Com'Sup – École Supérieure de Communication et de Publicité", sigle="Com'Sup", ville="Casablanca", type="institut", statut="prive",
         match=[r"com ?sup\b(?! ?\w)", r"communication et de publicite"], officiel=[("Com'sup", "Casablanca")]),
    dict(id="ma-esmc", nom="ESMC – École Supérieure de Management et de Communication", sigle="ESMC", ville="Casablanca", type="ecole_commerce", statut="prive",
         match=[r"\besmc\b"], officiel=[("ESMC", "Casablanca")]),
    dict(id="ma-ispts-ouezzane", nom="Institut Supérieur Privé des Techniques de Santé d'Ouezzane – Dar Adamana", sigle="Dar Adamana", ville="Ouezzane", type="ecole_sante", statut="prive",
         match=[r"dar adamana"]),
    dict(id="ma-espii", nom="École Supérieure Privée d'Ingénierie et d'Innovation", sigle="ESPII", ville="Casablanca", type="ecole_ingenieurs", statut="prive",
         match=[r"^ecole superieure privee d ingenierie et d innovation"], villes=["Casablanca"]),
]

LABEL_LIBELLE = {"reconnu_etat": "Reconnu par l'État", "diplomes_homologues": "Diplômes homologués", "professionnel": "Établissement professionnel"}
TYPE_LIBELLE = {
    "universite": "Université", "ecole_ingenieurs": "École d'ingénieurs", "ecole_commerce": "École de commerce / management",
    "ecole_sante": "École de santé", "architecture": "École d'architecture", "arts_design": "École d'art, de design et d'architecture d'intérieur",
    "institut": "Institut", "formation_professionnelle": "Formation professionnelle",
}
VILLES = {"mohammadia": "Mohammedia", "beni mellal": "Béni Mellal", "kenitra": "Kénitra", "sale": "Salé", "fes": "Fès", "meknes": "Meknès",
          "tetouan": "Tétouan", "ben guerir": "Ben Guérir", "bouskoura": "Bouskoura"}


def ville_std(v):
    return VILLES.get(norm(v), v.strip())


# --------------------------------------------------------------------------------------------
# Diplôme, durée et rattachement aux formations génériques Navigoal (orientation, métiers)
# --------------------------------------------------------------------------------------------
ECOLE_INGENIEURS = re.compile(r"ingenie|ingenieur|polytechni|engineering|genie|centrale|arts et metiers|computer science|informatique et du numerique|aerospace|aeronautique")
SPECIALITES_MEDICALES = re.compile(r"cardiolog|chirurgi|dermatolog|endocrinolog|gastro|hematolog|neurolog|neuro ?chirurg|nephrolog|oncolog|ophtalmolog|oto rhino|pneumo|psychiatr|pediatr|radiotherap|rhumatolog|stomatolog|traumatolog|urolog|gynecolog|anatomie|anesthesie (et )?reanimation|radiologie|^medecine (interne|nucleaire|physique|d urgence)|analyses biologiques medicales|biologie medicale|hepato")
SPECIALITES_DENTAIRES = re.compile(r"odontolog|parodont|prothese (adjointe|conjointe)|pedodont|orthopedie dento")


def diplome(intitule, options, etab_type, officiel, composante=""):
    """(libellé du diplôme, durée en années, niveau) ; (None, None, None) si le texte ne permet pas de le déterminer."""
    t = norm(intitule + " " + options)
    ti = norm(intitule)
    c = norm(composante)
    if officiel:
        d, duree = officiel
        dn = norm(d)
        years = int(re.search(r"(\d+)", duree).group(1)) if re.search(r"(\d+)", duree) else None
        if "preparatoire" in dn:
            return "Cycle préparatoire intégré", 2, "niv-bac2"
        if "ingenieur" in dn or "ingenierie" in dn:
            return "Diplôme d'ingénieur", years or 5, "niv-bac5"
        if "master" in dn or "bac 3" in dn or "bac +3" in d:
            return "Master", years or 2, "niv-bac5"
        if "architecte" in dn:
            return "Diplôme d'architecte", years or 6, "niv-bac5"
        if "ecoles nationales de commerce" in dn:
            return "Diplôme de grande école de commerce", years or 5, "niv-bac5"
        if "licence" in dn or "3 ans apres bac" in dn or "s5" in dn:
            return "Licence / Bachelor", years or 3, "niv-bac3"
        if "5 ans apres bac" in dn:
            return "Diplôme Bac+5", years or 5, "niv-bac5"
    medecine = "medecine" in c and "dentaire" not in c and "veterinaire" not in c
    dentaire = "dentaire" in c or "odontolog" in c
    # Spécialisations (après le doctorat) dans les facultés de médecine et de médecine dentaire
    if medecine and SPECIALITES_MEDICALES.search(ti):
        return "Diplôme de spécialité médicale (après le doctorat)", None, "niv-bac8"
    if "pharmacie" in c and re.match(r"pharmacie (clinique|hospitaliere|industrielle)", ti):
        return "Diplôme de spécialité en pharmacie (après le doctorat)", None, "niv-bac8"
    if dentaire and SPECIALITES_DENTAIRES.search(ti):
        return "Diplôme de spécialité en médecine dentaire (après le doctorat)", None, "niv-bac8"
    if re.search(r"medecine dentaire|chirurgie dentaire|dental", ti) or (dentaire and re.search(r"^(doctorat|medecine)", ti)):
        return "Doctorat en médecine dentaire", 6, "niv-bac7"
    if re.search(r"veterinaire|veterinary", ti):
        return "Doctorat vétérinaire", 6, "niv-bac7"
    if re.match(r"(doctorat en )?(pharmacie|pharmacy)$", ti):
        return "Doctorat en pharmacie", 6, "niv-bac7"
    if re.match(r"(doctorat en )?(medecine|medicine|general medicine)( generale)?( en anglais)?$", ti) or ti in ("medecine generale", "general medicine"):
        return "Doctorat en médecine", 7, "niv-bac7"
    if "preparatoire" in t:
        return "Cycle préparatoire intégré", 2, "niv-bac2"
    if ti.startswith("master") or ti.startswith("mba"):
        return "Master", 2, "niv-bac5"
    if re.search(r"grande? ecole program", ti) or "programme grande ecole" in ti:
        return "Programme Grande École (Bac+5)", 5, "niv-bac5"
    if "bac 5" in t or "cycle ingenieur" in t:
        return "Diplôme d'ingénieur", 5, "niv-bac5"
    if ti.startswith("licence") or "bachelor" in ti or "bac 3" in t:
        return "Licence / Bachelor", 3, "niv-bac3"
    if ti in ("architecture",):
        return "Diplôme d'architecte", 6, "niv-bac5"
    sante_para = re.search(r"paramedic|infirmi|techniques de sante|reeducation|readaptation|metiers de la sante|metiers et technologies de la sante", c)
    if etab_type == "ecole_sante" or sante_para:
        if not re.search(r"^genie|^ingenierie|engineering", ti):
            return "Licence", 3, "niv-bac3"
    ecole_ing = etab_type == "ecole_ingenieurs" or ECOLE_INGENIEURS.search(c)
    if ecole_ing and re.match(r"(genie|ingenierie|engineering|.* engineering$|computer science|aerospace|automotive)", ti):
        return "Diplôme d'ingénieur", 5, "niv-bac5"
    return None, None, None


# (expression, formation générique, domaine) — premier motif trouvé dans l'intitulé, sinon dans les options
FORMATIONS = [
    (r"preparatoire", "frm-cpge-scientifique", "dom-ingenierie"),
    (r"\b(medecine|chirurgie) dentaire\b|\bdental\b|\bodontolog|\bparodont|\bpedodont|prothese (adjointe|conjointe)|orthopedie dento", "frm-doctorat-chirurgie-dentaire", "dom-sante"),
    (r"\bveterinaire|\bveterinary", "frm-doctorat-veterinaire", "dom-sante"),
    (r"^(doctorat en )?(pharmacie|pharmacy)\b", "frm-doctorat-pharmacie", "dom-sante"),
    (r"^(doctorat en )?(medecine|medicine)\b|\bgeneral medicine\b", "frm-doctorat-medecine", "dom-sante"),
    (r"cardiolog|chirurgi|dermatolog|endocrinolog|gastro|hematolog|neurolog|nephrolog|oncolog|ophtalmolog|oto rhino|pneumo|psychiatr|pediatr|radiotherap|rhumatolog|stomatolog|traumatolog|urolog|gynecolog|anatomie|hepato", "frm-doctorat-medecine", "dom-sante"),
    (r"kinesi|reeducation|readaptation|psychomotri|orthophon|ergothera|osteopath|orthopti|audioprothes", "frm-licence-kinesitherapie", "dom-sante"),
    (r"sage femme|obstetri", "frm-licence-sage-femme", "dom-sante"),
    (r"infirmi|\bsoins\b|anesthesi|bloc operatoire|\burgences?\b", "frm-licence-sciences-infirmieres", "dom-sante"),
    (r"laboratoire|analyses? (biologiques )?medicales?|biologie medicale|radiolog|imagerie|\boptique|optometr|dieteti|nutrition", "frm-licence-biologie-medicale", "dom-sante"),
    (r"biomedica|dispositifs medicaux|technologie medicale|sante digitale|digital health|sante numerique|genie digital en sante", "frm-ingenieur-genie-electrique", "dom-sante"),
    (r"sante publique|management de la sante|management hospitalier", "frm-master-sante-publique", "dom-sante"),
    (r"biotechnolog|sciences biologiques|bio ?informat|neuroscience", "frm-licence-biologie", "dom-sciences"),
    (r"\bfinanc|\baudit|comptab|controle de gestion|\bbanque|\bassurance", "frm-master-finance-audit", "dom-finance"),
    (r"intelligence artificielle|artificial intelligence|\bdata\b|donnees|big data|\banalytics\b|decisionnel|business intelligence", "frm-master-data-science-ia", "dom-numerique"),
    (r"cyber|securite informatique|securite des (systemes|reseaux)|security", "frm-master-cybersecurite", "dom-numerique"),
    (r"reseaux?|telecom|communication systems", "frm-ingenieur-telecoms", "dom-numerique"),
    (r"genie logiciel|software|developpement (logiciel|web|informatique)|full ?stack|\bweb\b|\bmobile\b|jeux video|realite virtuelle", "frm-licence-genie-logiciel", "dom-numerique"),
    (r"systemes? d information|information systems|informatique (appliquee a la|de) gestion|\berp\b|miage", "frm-master-systemes-information", "dom-numerique"),
    (r"genie civil|ingenierie civile|batiment|\bbtp\b|travaux publics|construction|structures|ponts et chaussees|\bbim\b|ordonnancement|subaquatique", "frm-ingenieur-genie-civil", "dom-btp"),
    (r"procedes|chimi|chemical|materia|pharmaceutique|agro ?alimentaire|alimentaire|agro industrie|cosmetique", "frm-ingenieur-genie-chimique", "dom-ingenierie"),
    (r"industriel|industrial|systemes de production|productique|qualite|qhse|hygiene|maintenance|\blean\b|physique", "frm-ingenieur-genie-industriel", "dom-ingenierie"),
    (r"marketing|\bcommerce\b|\bvente|negoce|e ?business|international business|affaires internationales|\btrade\b", "frm-master-marketing", "dom-commerce"),
    (r"journalis|\bmedias?\b|audiovisuel|cinema|communication|scenario", "frm-licence-communication", "dom-communication"),
    (r"informati|computer|numerique|\bcloud\b|multimedia|\bdigital\b|\biot\b", "frm-ingenieur-informatique", "dom-numerique"),
    (r"aeronaut|aerospa|avionique|aeronautic", "frm-ingenieur-genie-mecanique", "dom-ingenierie"),
    (r"automobile|automotive|mecatroni|mecanique|electromecani|cobotique|robotique", "frm-ingenieur-genie-mecanique", "dom-ingenierie"),
    (r"electri|automati|systemes embarques|electroni", "frm-ingenieur-genie-electrique", "dom-ingenierie"),
    (r"architecture d interieur|design d interieur|design d espace|decoration", "frm-licence-design-graphique", "dom-arts-design"),
    (r"architecture|urbanisme|urbain|paysage", "frm-architecture", "dom-btp"),
    (r"energ|renouvelable|\beau\b|environnement|developpement durable|sustainable", "frm-master-energies-renouvelables", "dom-energie-mines"),
    (r"\bmines\b|geolog", "frm-ingenieur-mines", "dom-energie-mines"),
    (r"\bagri|agronom|fertilisation", "frm-ingenieur-agronome", "dom-agri-env"),
    (r"logistique|transport|supply chain|portuaire|maritime|achats?", "frm-licence-logistique", "dom-transport-logistique"),
    (r"ressources humaines|\brh\b|\bgrh\b|human resources", "frm-master-grh", "dom-gestion"),
    (r"tourisme|hotel|hotellerie|restauration|evenementiel", "frm-licence-hotellerie", "dom-tourisme"),
    (r"\bdesign|graphi|\barts? visuels|\bart\b|\bmode\b|animation|culture", "frm-licence-design-graphique", "dom-arts-design"),
    (r"\bdroit|juridique|sciences politiques|relations internationales|gouvernance|\blaw\b|patrimoine|foncier", "frm-licence-droit-prive", "dom-droit"),
    (r"psycholog", "frm-licence-psychologie", "dom-shs"),
    (r"langues?|traduct|anglais|english|linguist|literature", "frm-licence-langues-etrangeres", "dom-lettres-langues"),
    (r"economi|sciences sociales|sociolog|mathematiques", "frm-licence-economie", "dom-shs"),
    (r"education|enseignement|pedagog", "frm-licence-sciences-education", "dom-education"),
    (r"management|gestion|administration|entrepreneuriat|entreprise|business|\bmba\b|organisations|sport", "frm-licence-gestion", "dom-gestion"),
    (r"ingenieur|ingenierie|genie|engineering|sciences and technology|innovation", "frm-ingenieur-genie-industriel", "dom-ingenierie"),
]
NIVEAU_FORMATION = {
    # formation générique Bac+5 -> équivalent Bac+3 quand la filière est une licence / un bachelor
    "frm-master-data-science-ia": "frm-licence-informatique", "frm-master-cybersecurite": "frm-licence-reseaux-securite",
    "frm-ingenieur-informatique": "frm-licence-informatique", "frm-master-systemes-information": "frm-licence-informatique",
    "frm-ingenieur-telecoms": "frm-licence-reseaux-securite", "frm-master-finance-audit": "frm-licence-banque-finance",
    "frm-master-marketing": "frm-bachelor-business", "frm-master-grh": "frm-licence-grh", "frm-ingenieur-genie-civil": "frm-licence-genie-civil",
    "frm-ingenieur-genie-mecanique": "frm-licence-genie-mecanique", "frm-ingenieur-genie-electrique": "frm-licence-genie-electrique",
    "frm-master-energies-renouvelables": "frm-master-energies-renouvelables", "frm-ingenieur-agronome": "frm-licence-agronomie",
}
NIVEAU_FORMATION_MASTER = {"frm-licence-gestion": "frm-master-management", "frm-licence-logistique": "frm-master-logistique",
                           "frm-licence-droit-prive": "frm-master-droit-affaires", "frm-licence-grh": "frm-master-grh"}


def formation(intitule, options, diplome_lib):
    for texte in (norm(intitule), norm(options)):
        if not texte:
            continue
        for motif, frm, dom in FORMATIONS:
            if re.search(motif, texte):
                if diplome_lib and diplome_lib.startswith("Licence"):
                    frm = NIVEAU_FORMATION.get(frm, frm)
                if diplome_lib and (diplome_lib.startswith("Master") or "Grande" in diplome_lib):
                    frm = NIVEAU_FORMATION_MASTER.get(frm, frm)
                return frm, dom
    return None, None


def mots(s):
    s = re.sub(r"\(.*?\)|\bbac ?\+ ?\d\b", " ", s or "")
    vides = {"et", "de", "des", "du", "la", "le", "les", "l", "d", "en", "a"}
    return {w for w in norm(s).split() if w not in vides}


def proche(a, b):
    """Deux intitulés désignent-ils la même filière (variantes d'écriture entre sources) ?"""
    x, y = mots(a), mots(b)
    if not x or not y:
        return False
    sig = {"qualite", "hygiene", "securite", "environnement"}
    if "qhse" in x | y and (sig <= x or sig <= y or "qhse" in x & y):
        return True
    return len(x & y) / len(x | y) >= 0.75


def annee_debut(a):
    m = re.match(r"(\d{4})", a or "")
    return int(m.group(1)) if m else 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--annee", default="2026-2027", help="année universitaire de référence (accréditation en cours)")
    args = ap.parse_args()
    ref_year = annee_debut(args.annee)

    compiled = [(e, [re.compile(m) for m in e["match"]]) for e in ETABLISSEMENTS]
    by_id = {e["id"]: e for e in ETABLISSEMENTS}

    def find(etab_txt, ville):
        t = norm(etab_txt)
        v = ville_std(ville)
        hits = [e for e, pats in compiled if any(p.search(t) for p in pats) and (not e.get("villes") or v in e["villes"])]
        # préférer la règle la plus spécifique (avec villes)
        hits.sort(key=lambda e: 0 if e.get("villes") else 1)
        return hits[0] if hits else None

    filieres = {}  # id -> {cle: filière}
    non_rattaches = []

    # 1. Liste officielle 2024-2025 (diplôme, durée)
    offi = json.load(open(os.path.join(SRC, "filieres_accreditees_eesp_2024-2025.json"), encoding="utf-8"))
    offi_index = {}
    officiel_map = {}
    for e in ETABLISSEMENTS:
        for sig, v in e.get("officiel", []):
            officiel_map[(sig, norm(v))] = e["id"]

    def fin_officielle(s):
        m = re.findall(r"(\d{4})\s*/\s*(\d{4})", s)
        return f"{m[-1][0]}-{m[-1][1]}" if m else ""

    for r in offi:
        nom, sig, ville, fil, opt, dipl, duree, debut, fin, bo = r["cells"]
        eid = officiel_map.get((sig, norm(ville)))
        if not eid:
            hit = find(nom + " " + sig, ville)
            eid = hit["id"] if hit else None
        if eid:
            offi_index[(eid, norm(fil))] = (dipl, duree, fin_officielle(fin), bo)

    def add(eid, composante, ville, fil, opt, fin, arrete, bo, source):
        key = norm(fil) + "|" + norm(composante)
        cur = filieres.setdefault(eid, {})
        prev = cur.get(key)
        if prev and annee_debut(prev["fin_accreditation"]) >= annee_debut(fin):
            return
        cur[key] = dict(intitule=fil.strip(), options=opt.strip(), composante=composante, ville=ville_std(ville),
                        fin_accreditation=fin, arrete=arrete, bulletin_officiel=bo, source=source)

    # 2. Registre cumulé des arrêtés (référence la plus récente)
    with open(os.path.join(SRC, "registre_filieres_accreditees_2026-09-13.csv"), encoding="utf-8-sig") as f:
        for x in csv.DictReader(f, delimiter=";"):
            hit = find(x["etablissement"] + " " + x["sigle"], x["ville"])
            if not hit:
                non_rattaches.append((x["etablissement"], x["ville"], x["fin_accreditation"]))
                continue
            composante = x["etablissement"].split(" — ")[0] if hit["type"] == "universite" else ""
            add(hit["id"], composante, x["ville"], x["filiere"], x["options"].replace(" · ", ", "), x["fin_accreditation"],
                x["dernier_arrete"], x["bulletin_officiel"], "Arrêté " + x["dernier_arrete"] + " (BO n° " + x["bulletin_officiel"] + ")")

    # 3. Filières de la liste officielle absentes du registre
    for r in offi:
        nom, sig, ville, fil, opt, dipl, duree, debut, fin, bo = r["cells"]
        eid = officiel_map.get((sig, norm(ville))) or ((find(nom + " " + sig, ville) or {}).get("id"))
        if eid and not any(proche(fil, v["intitule"]) for v in filieres.get(eid, {}).values()):
            add(eid, "", ville, fil, opt, fin_officielle(fin), "", bo, "Liste ministérielle 2024-2025 (" + bo + ")")

    # 4. Reconnaissance par l'État (décrets)
    rec_txt = open(os.path.join(SRC, "reconnus_par_l_etat_2026.txt"), encoding="utf-8").read()
    decrets = {}
    for e in ETABLISSEMENTS:
        if e.get("rec"):
            decrets[e["id"]] = "Liste officielle des universités et établissements reconnus par l'État (n° %d)" % e["rec"]

    # Fiches existantes (logos, photos, coordonnées) : version archivée multi-pays puis référentiel courant
    archive = os.path.join(ROOT, "data", "archives", "etablissements_superieurs_v1_GA_MA_SN.json")
    ancien = {x["id"]: x for x in json.load(open(archive, encoding="utf-8"))["items"]} if os.path.exists(archive) else {}
    ancien.update({x["id"]: x for x in json.load(open(os.path.join(REF, "etablissements_superieurs.json"), encoding="utf-8"))["items"]})
    enrich_path = os.path.join(SRC, "enrichissement.json")
    enrich = json.load(open(enrich_path, encoding="utf-8")) if os.path.exists(enrich_path) else {}

    items, exclus = [], []
    for e in ETABLISSEMENTS:
        toutes = list(filieres.get(e["id"], {}).values())
        en_cours = [f for f in toutes if annee_debut(f["fin_accreditation"]) >= ref_year]
        if not en_cours:
            exclus.append(dict(id=e["id"], nom=e["nom"], ville=e["ville"], reconnu=bool(e.get("rec")),
                               filieres_echues=len(toutes), derniere_echeance=max([f["fin_accreditation"] for f in toutes], default=None)))
            continue
        progs = []
        for f in sorted(en_cours, key=lambda f: (f["composante"], f["intitule"])):
            o = offi_index.get((e["id"], norm(f["intitule"])))
            dlib, duree, niveau = diplome(f["intitule"], f["options"], e["type"], (o[0], o[1]) if o else None, f["composante"])
            frm, dom = formation(f["intitule"], f["options"], dlib)
            progs.append(dict(
                intitule=f["intitule"], options=f["options"] or None, composante=f["composante"] or None,
                ville=f["ville"] if f["ville"] != e["ville"] else None,
                diplome=dlib, duree_annees=duree, niveau=niveau, formation=frm, domaine=dom,
                homologation=dict(statut="accreditee", fin=f["fin_accreditation"], texte=f["source"]),
            ))
        label = "reconnu_etat" if e.get("rec") and not e.get("rec_en_cours") else "diplomes_homologues"
        old = ancien.get(e["id"]) or {}
        # Réseaux désormais scindés par ville (EMSI, ISGA…) : logo de l'ancienne fiche commune
        parent = next((v for k, v in ancien.items() if e["id"].startswith(k + "-") and v.get("logo")), None)
        if not old.get("logo") and parent:
            old = {**old, "logo": parent["logo"]}
        x = enrich.get(e["id"], {})
        item = dict(
            id=e["id"], nom=e["nom"], sigle=e["sigle"], pays="MA", ville=e["ville"],
            type=e["type"], type_libelle=TYPE_LIBELLE[e["type"]], statut=e["statut"],
            label=label, label_libelle=LABEL_LIBELLE[label],
            reconnaissance=decrets.get(e["id"]) if label == "reconnu_etat" else None,
            reconnaissance_en_cours=bool(e.get("rec_en_cours")),
            site_web=x.get("site_web") or old.get("site_web"),
            annee_creation=x.get("annee_creation") or old.get("annee_creation"),
            adresse=x.get("adresse"),
            description=x.get("description"),
            coordonnees=x.get("coordonnees") or old.get("coordonnees"),
            wikidata=x.get("wikidata") or old.get("wikidata"),
            formations=sorted({p["formation"] for p in progs if p["formation"]}),
            filieres=progs,
            offre_indicative=False,
            logo=old.get("logo"), photos=old.get("photos", []),
            sources=["Ministère de l'Enseignement supérieur (enssup.gov.ma)", "Bulletin officiel — arrêtés d'accréditation des filières"],
        )
        items.append(item)

    out = {
        "_meta": {
            "referentiel": "etablissements_superieurs", "version": "2.0.0", "date": datetime.date.today().isoformat(), "plateforme": "Navigoal",
            "destination": "MA", "annee_reference": args.annee,
            "regle": "Seuls figurent les établissements privés délivrant des diplômes homologués par l'État et leurs filières dont l'accréditation est en cours pour l'année de référence.",
            "labels": LABEL_LIBELLE, "types": TYPE_LIBELLE,
            "sources": ["data/sources/maroc/" + n for n in sorted(os.listdir(SRC))],
        },
        "items": items,
    }
    json.dump(out, open(os.path.join(REF, "etablissements_superieurs.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    # Liens formation générique -> établissements (Maroc uniquement)
    fpath = os.path.join(REF, "formations.json")
    fdoc = json.load(open(fpath, encoding="utf-8"))
    for f in fdoc["items"]:
        f["etablissements"] = [i["id"] for i in items if f["id"] in i["formations"]]
    json.dump(fdoc, open(fpath, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    json.dump({"annee_reference": args.annee, "exclus": exclus, "non_rattaches": sorted(set(non_rattaches))},
              open(os.path.join(SRC, "rapport_build.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    nprog = sum(len(i["filieres"]) for i in items)
    print(f"{len(items)} établissements, {nprog} filières homologuées ; {len(exclus)} fiches sans filière en cours ; "
          f"{len(set(non_rattaches))} intitulés du registre non rattachés (voir rapport_build.json).")


if __name__ == "__main__":
    main()
