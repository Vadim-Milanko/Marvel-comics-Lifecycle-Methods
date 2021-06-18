import React, { Component } from 'react';
import queryString from 'query-string';
import { omit } from 'lodash';

import { IProps, IState } from './interfaces';
import { queryNameStartsWith, queryOrderBy, queryOffset, queryPage, LIMIT, QUERY_ORDER_BY, STANDART_MEDIUM, ASC_ORDER, DESC_ORDER } from './constants';
import Header from '../../components/Header/Header';
import Character from './components/Character/Character';
import Spinner from '../../components/Spinner/Spinner';
import SearchBar from './components/SearchBar/SearchBar';
import Pagination from '@atlaskit/pagination';
import api from '../../api/Api';
import { getQueryParams } from '../../utils';

import './style.scss';

class SearchPage extends Component<IProps, IState> {
    constructor(props: IProps) {
        super(props)

        this.state = {
            characters: [],
            searchQuery: '',
            total: 0,
            isLoading: false,
            ordering: ASC_ORDER,
            page: 1,
        }
    }

    async fetchCharacters(): Promise<void> {
        const { location } = this.props;
        const { page } = this.state;

        const queryParams = getQueryParams(location.search);
        const name = queryParams.nameStartsWith as string;
        const pageFromUrl = queryParams[queryPage];

        let pageNumber;
        let currentOffset;

        if (typeof pageFromUrl === 'undefined') {
            pageNumber = page;
            currentOffset = LIMIT * (pageNumber - 1);
        } else {
            pageNumber = pageFromUrl;
            currentOffset = LIMIT * (pageNumber - 1);
        }

        this.setState({ isLoading: true });

        try {
            const response = await api.fetchCharacters({ params: { ...omit(queryParams, [queryPage]), [queryOffset]: currentOffset } });

            this.setState({
                characters: response.results,
                searchQuery: name || '',
                total: response.total,
                isLoading: false,
                page: pageNumber,
            })
        } catch (error) {
            this.setState({ isLoading: false });
        }
    }

    componentDidMount(): void {
        window.addEventListener('popstate', () => {
            this.fetchCharacters();
        });

        this.fetchCharacters();
    }

    private onInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        this.setState({
            searchQuery: event.target.value
        });
    }

    private searchCharacters = async (): Promise<void> => {
        const { history, location } = this.props;
        const queryParams = getQueryParams(location.search);
        const name = queryParams.nameStartsWith as string;

        const { searchQuery } = this.state;

        this.setState({ isLoading: true });

        try {
            const newQueryParams = { ...queryParams, [queryNameStartsWith]: searchQuery };
            const response = await api.fetchCharacters({ params: { ...omit(newQueryParams, [queryPage]), [queryOffset]: 0 } });
            const queryStringURL = queryString.stringify({ ...newQueryParams, [queryPage]: 1 });

            if (name !== searchQuery) {
                history.push(`${history.location.pathname}?${queryStringURL}`);
            } else {
                history.replace(`${history.location.pathname}?${queryStringURL}`);
            }

            this.setState({
                characters: response.results,
                total: response.total,
                isLoading: false,
                page: 1,
            });
        } catch (error) {
            this.setState({ isLoading: false });
        }
    }

    private changeOrder = async (): Promise<void> => {
        const { ordering: { order } } = this.state;
        const { history, location } = this.props;
        const newOrder = order === QUERY_ORDER_BY.ASC ? DESC_ORDER : ASC_ORDER;
        const queryParams = getQueryParams(location.search);

        this.setState({ isLoading: true });
        const newQueryParams = { ...queryParams, [queryOrderBy]: newOrder.order };

        try {
            const response = await api.fetchCharacters({ params: omit(newQueryParams, [queryPage]) });
            const queryStringURL = queryString.stringify(newQueryParams);

            history.push(`${location.pathname}?${queryStringURL}`);

            this.setState({
                characters: response.results,
                total: response.total,
                isLoading: false,
                ordering: newOrder,
            });
        } catch (error) {
            this.setState({ isLoading: false });
        }
    }

    private getPagesPagination = (total: number): number[] => {
        const pageCount = Math.ceil(total / LIMIT);
        const pages = [];

        for (let i = 1; i <= pageCount; i++) {
            pages.push(i);
        }

        return pages;
    }

    private onChangePagination = async (pageNumber: number): Promise<void> => {
        const { history, location } = this.props;

        const offset = LIMIT * (pageNumber - 1);
        const queryParams = getQueryParams(location.search);

        this.setState({ isLoading: true });
        const newQueryParams = { ...queryParams, [queryOffset]: offset };

        try {
            const response = await api.fetchCharacters({ params: omit(newQueryParams, ['page']) });
            const queryStringURL = queryString.stringify(omit({ ...newQueryParams, [queryPage]: pageNumber }, ['limit', 'apikey', 'offset']));

            history.push(`${location.pathname}?${queryStringURL}`);

            this.setState({
                characters: response.results,
                total: response.total,
                isLoading: false,
                page: pageNumber,
            });
        } catch (error) {
            this.setState({ isLoading: false });
        }
    }

    public render(): JSX.Element {
        const { searchQuery, characters, total, isLoading, ordering: { title }, page } = this.state;

        const queryParams = getQueryParams(location.search);
        let titleOrderBy = title;

        if (typeof queryParams[queryOrderBy] !== 'undefined') {
            titleOrderBy = queryParams[queryOrderBy] === ASC_ORDER.order ? ASC_ORDER.title : DESC_ORDER.title;
        }

        return (
            <div className='search-page-wrapper'>
                <Header />
                <SearchBar
                    searchQuery={searchQuery}
                    title={titleOrderBy}
                    onInputChange={this.onInputChange}
                    changeOrder={this.changeOrder}
                    searchHeroes={this.searchCharacters} />
                <h2 className='list-title'>List of Character</h2>
                <>
                    {
                        characters.map(character => {
                            const { thumbnail } = character;
                            const { extension, path } = thumbnail;
                            const imgSize = STANDART_MEDIUM;
                            const imgUrl = `${path}/${imgSize}.${extension}`;

                            return (
                                <Character
                                    key={character.id}
                                    id={character.id}
                                    name={character.name}
                                    imgUrl={imgUrl} />
                            )
                        })
                    }
                </>
                <Spinner isLoading={isLoading} />
                <div className='pagination'>
                    <Pagination
                        max={10}
                        pages={this.getPagesPagination(total)}
                        selectedIndex={page === 0 ? page : page - 1}
                        onChange={(event: React.SyntheticEvent<any, Event>, page: number) => {
                            this.onChangePagination(page);
                        }} />
                </div>
            </div>
        )
    }
}

export default SearchPage